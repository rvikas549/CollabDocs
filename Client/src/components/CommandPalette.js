import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FilePlus2, FileText, House, LogOut, Moon, Search, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { docsApi } from '../lib/docsApi';
import { apiError } from '../config/api';
import { timeAgo } from '../lib/utils';

const PaletteContext = createContext(null);
const GROUP_ORDER = ['This document', 'Actions', 'Documents', 'Navigation', 'Preferences', 'Account'];

let docsCache = null;

export function CommandPaletteProvider({ children }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  // Commands live in a ref so registering them never triggers a re-render loop.
  const setsRef = useRef(new Map());

  const register = useCallback((id, commands) => {
    setsRef.current.set(id, commands);
    return () => {
      if (setsRef.current.get(id) === commands) setsRef.current.delete(id);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      docsCache = null;
      return undefined;
    }

    const onKey = (event) => {
      if (event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((o) => !o);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  const value = useMemo(
    () => ({ openPalette: () => setOpen(true), closePalette: () => setOpen(false), register }),
    [register]
  );

  return (
    <PaletteContext.Provider value={value}>
      {children}
      {open && user && <CommandPalette contextual={[...setsRef.current.values()].flat()} onClose={() => setOpen(false)} />}
    </PaletteContext.Provider>
  );
}

export const usePalette = () => useContext(PaletteContext);

/** Registers page-specific commands. Pass a memoised array. */
export function useCommands(id, commands) {
  const { register } = usePalette();
  useEffect(() => register(id, commands), [id, commands, register]);
}

function score(cmd, query) {
  if (!query) return 1;
  const title = cmd.title.toLowerCase();
  const extra = `${cmd.keywords || ''} ${cmd.subtitle || ''}`.toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  let total = 0;
  for (const word of words) {
    if (title.startsWith(word)) total += 4;
    else if (title.split(/\s+/).some((w) => w.startsWith(word))) total += 3;
    else if (title.includes(word)) total += 2;
    else if (extra.includes(word)) total += 1;
    else return 0;
  }
  return total;
}

function CommandPalette({ contextual, onClose }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [docs, setDocs] = useState(docsCache);
  const listRef = useRef(null);

  useEffect(() => {
    docsApi
      .list('all')
      .then((list) => {
        docsCache = list;
        setDocs(list);
      })
      .catch(() => setDocs((d) => d || []));
  }, []);

  const commands = useMemo(() => {
    const base = [
      {
        id: 'new-doc',
        group: 'Actions',
        title: 'Create new document',
        icon: FilePlus2,
        keywords: 'new blank add start',
        run: async () => {
          const doc = await docsApi.create();
          navigate(`/doc/${doc.id}`);
        },
      },
      { id: 'home', group: 'Navigation', title: 'Go to dashboard', icon: House, keywords: 'home all documents', run: () => navigate('/') },
      {
        id: 'theme',
        group: 'Preferences',
        title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: 'theme appearance dark light',
        run: toggle,
      },
      { id: 'sign-out', group: 'Account', title: 'Sign out', icon: LogOut, keywords: 'logout log out', run: signOut },
    ];

    const documents = (docs || []).map((doc) => ({
      id: `doc-${doc.id}`,
      group: 'Documents',
      title: doc.title || 'Untitled document',
      emoji: doc.icon,
      icon: FileText,
      subtitle: `Edited ${timeAgo(doc.updatedAt)}`,
      keywords: doc.preview,
      run: () => navigate(`/doc/${doc.id}`),
    }));

    return [...contextual, ...base, ...documents];
  }, [contextual, docs, navigate, signOut, theme, toggle]);

  const results = useMemo(() => {
    const scored = commands
      .map((cmd) => ({ cmd, s: score(cmd, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => {
        const g = GROUP_ORDER.indexOf(a.cmd.group) - GROUP_ORDER.indexOf(b.cmd.group);
        return g !== 0 ? g : b.s - a.s;
      })
      .map((r) => r.cmd);

    // Without a query, keep the documents section short.
    if (!query) {
      let docCount = 0;
      return scored.filter((c) => c.group !== 'Documents' || (docCount += 1) <= 6);
    }
    return scored.slice(0, 50);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const execute = async (cmd) => {
    onClose();
    try {
      await cmd.run();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (results[active]) execute(results[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  let lastGroup = null;

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-search">
          <Search />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search documents or type a command…"
            aria-label="Search commands"
          />
          <kbd>esc</kbd>
        </div>

        <div className="palette-list" ref={listRef} role="listbox">
          {results.length === 0 && (
            <div className="palette-empty">
              {docs === null ? 'Loading…' : <>No results for “{query}”</>}
            </div>
          )}

          {results.map((cmd, index) => {
            const header = cmd.group !== lastGroup ? cmd.group : null;
            lastGroup = cmd.group;
            const Icon = cmd.icon;

            return (
              <div key={cmd.id}>
                {header && <div className="palette-group">{header}</div>}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  className={`palette-item ${index === active ? 'is-active' : ''}`}
                  onMouseMove={() => index !== active && setActive(index)}
                  onClick={() => execute(cmd)}
                >
                  <span className="palette-item__icon">{cmd.emoji ? <span>{cmd.emoji}</span> : Icon && <Icon />}</span>
                  <span className="palette-item__text">
                    <span className="palette-item__title">{cmd.title}</span>
                    {cmd.subtitle && <span className="palette-item__sub">{cmd.subtitle}</span>}
                  </span>
                  {cmd.shortcut && <span className="palette-item__shortcut">{cmd.shortcut}</span>}
                  {index === active && <CornerDownLeft className="palette-item__enter" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span className="palette-foot__brand">CollabDocs</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
