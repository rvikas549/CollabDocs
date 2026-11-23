import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Check,
  Clock,
  Copy,
  ExternalLink,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  Rows3,
  Search,
  Star,
  Trash2,
  UserMinus,
  Users,
  Ellipsis,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCommands, usePalette } from '../components/CommandPalette';
import { docsApi, docUrl } from '../lib/docsApi';
import { apiError } from '../config/api';
import { TEMPLATES } from '../lib/templates';
import { colorFor, copyText, firstName, formatNumber, greeting, modKey, readStorage, timeAgo, writeStorage } from '../lib/utils';
import Logo from '../components/ui/Logo';
import Dropdown from '../components/ui/Dropdown';
import { Avatar, AvatarStack } from '../components/ui/Avatar';
import { ConfirmDialog, PromptDialog } from '../components/ui/Modal';
import ProfileMenu from '../components/ProfileMenu';
import ThemeToggle from '../components/ThemeToggle';
import ShortcutsModal from '../components/ShortcutsModal';
import '../styles/home.css';

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned by me' },
  { id: 'shared', label: 'Shared with me' },
  { id: 'starred', label: 'Starred' },
];

const SORTS = [
  { id: 'updated', label: 'Last edited' },
  { id: 'created', label: 'Date created' },
  { id: 'title', label: 'Title (A–Z)' },
];

const SORTERS = {
  updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  created: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  title: (a, b) => (a.title || '').localeCompare(b.title || ''),
};

function editedLabel(doc, uid) {
  const by = doc.lastEditedBy?.uid && doc.lastEditedBy.uid !== uid ? ` by ${firstName(doc.lastEditedBy.name)}` : '';
  return `Edited ${timeAgo(doc.updatedAt)}${by}`;
}

const spotlight = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { openPalette } = usePalette();

  const [docs, setDocs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [scope, setScope] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(() => readStorage('collabdocs.sort', 'updated'));
  const [view, setView] = useState(() => readStorage('collabdocs.view', 'grid'));
  const [creating, setCreating] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const load = useCallback(async () => {
    try {
      setDocs(await docsApi.list('all'));
      setLoadError('');
    } catch (err) {
      setLoadError(apiError(err));
      setDocs((current) => current || []);
    }
  }, []);

  useEffect(() => {
    document.title = 'Documents · CollabDocs';
    load();
    // Collaborators may have edited things while this tab was in the background.
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  useEffect(() => writeStorage('collabdocs.sort', sort), [sort]);
  useEffect(() => writeStorage('collabdocs.view', view), [view]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const list = docs || [];
    return {
      all: list.length,
      owned: list.filter((d) => d.isOwner).length,
      shared: list.filter((d) => !d.isOwner).length,
      starred: list.filter((d) => d.starred).length,
      words: list.reduce((sum, d) => sum + (d.wordCount || 0), 0),
    };
  }, [docs]);

  const visible = useMemo(() => {
    let list = docs || [];
    if (scope === 'owned') list = list.filter((d) => d.isOwner);
    if (scope === 'shared') list = list.filter((d) => !d.isOwner);
    if (scope === 'starred') list = list.filter((d) => d.starred);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((d) => `${d.title} ${d.preview || ''}`.toLowerCase().includes(q));

    return [...list].sort(SORTERS[sort] || SORTERS.updated);
  }, [docs, scope, query, sort]);

  const createDoc = useCallback(
    async (template) => {
      setCreating(template?.id || 'blank');
      try {
        const payload = template ? { icon: template.icon, ...template.build() } : {};
        const doc = await docsApi.create(payload);
        navigate(`/doc/${doc.id}`);
      } catch (err) {
        toast.error(apiError(err));
        setCreating(null);
      }
    },
    [navigate, toast]
  );

  const patchLocal = (id, patch) => setDocs((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const actions = {
    open: (doc) => navigate(`/doc/${doc.id}`),
    openNewTab: (doc) => window.open(`/doc/${doc.id}`, '_blank', 'noopener'),
    star: async (doc) => {
      patchLocal(doc.id, { starred: !doc.starred });
      try {
        await docsApi.star(doc.id, !doc.starred);
      } catch (err) {
        patchLocal(doc.id, { starred: doc.starred });
        toast.error(apiError(err));
      }
    },
    duplicate: async (doc) => {
      try {
        const copy = await docsApi.duplicate(doc.id);
        setDocs((list) => [copy, ...list]);
        toast.success(`Duplicated “${doc.title}”`);
      } catch (err) {
        toast.error(apiError(err));
      }
    },
    copyLink: async (doc) => {
      await copyText(docUrl(doc.id));
      toast.success('Link copied — anyone with it can join after signing in');
    },
    rename: (doc) => setDialog({ type: 'rename', doc }),
    remove: (doc) => setDialog({ type: doc.isOwner ? 'delete' : 'leave', doc }),
  };

  const runDialog = async (fn, success) => {
    try {
      await fn();
      setDialog(null);
      if (success) toast.success(success);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const paletteCommands = useMemo(
    () =>
      TEMPLATES.map((template) => ({
        id: `template-${template.id}`,
        group: 'Actions',
        title: `New from template: ${template.name}`,
        emoji: template.icon,
        keywords: `create ${template.description}`,
        run: () => createDoc(template),
      })),
    [createDoc]
  );
  useCommands('home', paletteCommands);

  const emptyCopy = {
    all: ['Your workspace is a blank canvas', 'Create your first document or start from a template above.'],
    owned: ["You haven't created anything yet", 'Hit “New” or pick a template to get going.'],
    shared: ['Nothing shared with you yet', 'When a teammate sends you a doc link, it shows up here automatically.'],
    starred: ['No starred documents', 'Star the docs you open most and they’ll live here.'],
  };

  return (
    <div className="home">
      <div className="home-glow" aria-hidden="true" />

      <header className="app-header glass">
        <div className="app-header__inner">
          <Link to="/" className="logo-link" aria-label="CollabDocs home">
            <Logo withText subtitle="Realtime workspace" />
          </Link>

          <button type="button" className="search-trigger" onClick={openPalette} aria-label="Search">
            <Search />
            <span>Search or jump to…</span>
            <span className="kbd-group">
              <kbd>{modKey}</kbd>
              <kbd>K</kbd>
            </span>
          </button>

          <div className="header-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-primary hide-sm" onClick={() => createDoc()} disabled={!!creating}>
              {creating === 'blank' ? <span className="spinner" /> : <Plus />}
              New
            </button>
            <ProfileMenu onShowShortcuts={() => setShowShortcuts(true)} />
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <h1 className="display home-greeting animate-fade-up">
            {greeting()}, <em className="text-gradient">{firstName(user.displayName)}</em>
          </h1>
          <p className="home-stats animate-fade-up" style={{ '--i': 1 }}>
            {docs ? (
              <>
                <span>
                  <b>{counts.all}</b> {counts.all === 1 ? 'document' : 'documents'}
                </span>
                <span>
                  <b>{counts.shared}</b> shared with you
                </span>
                <span>
                  <b>{formatNumber(counts.words)}</b> words written
                </span>
              </>
            ) : (
              <span>Warming up your workspace…</span>
            )}
          </p>
        </section>

        <section className="home-section">
          <div className="section-head">
            <h2>Start something new</h2>
            <span className="muted">Blank page or a head start</span>
          </div>

          <div className="templates">
            <button
              type="button"
              className="template template--blank animate-fade-up"
              onClick={() => createDoc()}
              disabled={!!creating}
              onPointerMove={spotlight}
            >
              <div className="template__art">
                {creating === 'blank' ? <span className="spinner" /> : <Plus />}
              </div>
              <div className="template__name">Blank document</div>
              <div className="template__desc">Start from scratch</div>
            </button>

            {TEMPLATES.map((template, index) => (
              <button
                type="button"
                key={template.id}
                className="template animate-fade-up"
                style={{ '--accent': template.accent, '--i': index + 1 }}
                onClick={() => createDoc(template)}
                disabled={!!creating}
                onPointerMove={spotlight}
              >
                <div className="template__art">
                  <span className="template__emoji">{template.icon}</span>
                  <i />
                  <i />
                  <i />
                  <i />
                  {creating === template.id && (
                    <span className="template__busy">
                      <span className="spinner" />
                    </span>
                  )}
                </div>
                <div className="template__name">{template.name}</div>
                <div className="template__desc">{template.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="docs-toolbar">
            <div className="tabs" role="tablist" aria-label="Filter documents">
              {SCOPES.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  role="tab"
                  aria-selected={scope === s.id}
                  className={`tab ${scope === s.id ? 'is-active' : ''}`}
                  onClick={() => setScope(s.id)}
                >
                  {s.id === 'starred' && <Star />}
                  {s.label}
                  {docs && <span className="tab-count">{counts[s.id]}</span>}
                </button>
              ))}
            </div>

            <div className="docs-controls">
              <div className="input-wrap docs-filter">
                <Search />
                <input
                  className="input"
                  placeholder="Filter documents…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Filter documents"
                />
              </div>

              <Dropdown
                width={190}
                trigger={({ toggle }) => (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={toggle}>
                    <ArrowUpDown />
                    <span className="hide-sm">{SORTS.find((s) => s.id === sort)?.label}</span>
                  </button>
                )}
              >
                {({ close }) => (
                  <>
                    <div className="menu-label">Sort by</div>
                    {SORTS.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className={`menu-item ${sort === s.id ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSort(s.id);
                          close();
                        }}
                      >
                        {s.label}
                        {sort === s.id && <Check style={{ marginLeft: 'auto' }} />}
                      </button>
                    ))}
                  </>
                )}
              </Dropdown>

              <div className="view-toggle" role="group" aria-label="Layout">
                <button
                  type="button"
                  className={view === 'grid' ? 'is-active' : ''}
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid />
                </button>
                <button
                  type="button"
                  className={view === 'list' ? 'is-active' : ''}
                  onClick={() => setView('list')}
                  aria-label="List view"
                >
                  <Rows3 />
                </button>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="banner banner--error">
              <span>{loadError}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
                Retry
              </button>
            </div>
          )}

          {docs === null ? (
            <DocsSkeleton view={view} />
          ) : visible.length === 0 ? (
            <div className="empty animate-fade-up">
              <div className="empty-art" aria-hidden="true">
                <span>📄</span>
                <span>✨</span>
                <span>📝</span>
              </div>
              <h3>{query ? `Nothing matches “${query}”` : emptyCopy[scope][0]}</h3>
              <p>{query ? 'Try a different word, or clear the filter.' : emptyCopy[scope][1]}</p>
              {query ? (
                <button type="button" className="btn btn-secondary" onClick={() => setQuery('')}>
                  Clear filter
                </button>
              ) : (
                (scope === 'all' || scope === 'owned') && (
                  <button type="button" className="btn btn-primary" onClick={() => createDoc()} disabled={!!creating}>
                    <Plus /> New document
                  </button>
                )
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="doc-grid">
              {visible.map((doc, index) => (
                <DocCard key={doc.id} doc={doc} index={index} uid={user.uid} actions={actions} />
              ))}
            </div>
          ) : (
            <div className="doc-list card">
              <div className="doc-row doc-row--head">
                <span>Name</span>
                <span className="hide-sm">Owner</span>
                <span className="hide-sm">Last edited</span>
                <span className="hide-sm">Words</span>
                <span />
              </div>
              {visible.map((doc, index) => (
                <DocRow key={doc.id} doc={doc} index={index} uid={user.uid} actions={actions} />
              ))}
            </div>
          )}
        </section>
      </main>

      {dialog?.type === 'rename' && (
        <PromptDialog
          title="Rename document"
          icon={Pencil}
          label="Title"
          initialValue={dialog.doc.title}
          confirmLabel="Rename"
          onCancel={() => setDialog(null)}
          onSubmit={(title) =>
            runDialog(async () => {
              const updated = await docsApi.update(dialog.doc.id, { title });
              patchLocal(dialog.doc.id, { title: updated.title, updatedAt: updated.updatedAt });
            }, 'Renamed')
          }
        />
      )}

      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title={`Delete “${dialog.doc.title}”?`}
          message="This permanently removes the document for everyone it's shared with. This can't be undone."
          confirmLabel="Delete forever"
          icon={Trash2}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            runDialog(async () => {
              await docsApi.remove(dialog.doc.id);
              setDocs((list) => list.filter((d) => d.id !== dialog.doc.id));
            }, 'Document deleted')
          }
        />
      )}

      {dialog?.type === 'leave' && (
        <ConfirmDialog
          title={`Remove “${dialog.doc.title}” from your list?`}
          message="You'll lose access until someone shares the link with you again. The document itself stays intact."
          confirmLabel="Remove"
          icon={UserMinus}
          onCancel={() => setDialog(null)}
          onConfirm={() =>
            runDialog(async () => {
              await docsApi.leave(dialog.doc.id);
              setDocs((list) => list.filter((d) => d.id !== dialog.doc.id));
            }, 'Removed from your documents')
          }
        />
      )}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

function DocMenu({ doc, actions }) {
  return (
    <Dropdown
      width={220}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={`icon-btn icon-btn-sm doc-menu-trigger ${open ? 'is-active' : ''}`}
          onClick={toggle}
          aria-label="Document actions"
        >
          <Ellipsis />
        </button>
      )}
    >
      {({ close }) => {
        const item = (fn) => () => {
          close();
          fn(doc);
        };
        return (
          <>
            <button type="button" className="menu-item" onClick={item(actions.openNewTab)}>
              <ExternalLink /> Open in new tab
            </button>
            <button type="button" className="menu-item" onClick={item(actions.rename)}>
              <Pencil /> Rename
            </button>
            <button type="button" className="menu-item" onClick={item(actions.duplicate)}>
              <Copy /> Duplicate
            </button>
            <button type="button" className="menu-item" onClick={item(actions.copyLink)}>
              <Link2 /> Copy link
            </button>
            <button type="button" className="menu-item" onClick={item(actions.star)}>
              <Star /> {doc.starred ? 'Remove star' : 'Add star'}
            </button>
            <div className="menu-sep" />
            <button type="button" className="menu-item danger" onClick={item(actions.remove)}>
              {doc.isOwner ? (
                <>
                  <Trash2 /> Delete
                </>
              ) : (
                <>
                  <UserMinus /> Remove from my list
                </>
              )}
            </button>
          </>
        );
      }}
    </Dropdown>
  );
}

function DocCard({ doc, index, uid, actions }) {
  return (
    <article
      className="doc-card animate-fade-up"
      style={{ '--i': Math.min(index, 12), '--accent': colorFor(doc.id) }}
      tabIndex={0}
      onClick={() => actions.open(doc)}
      onKeyDown={(e) => e.key === 'Enter' && actions.open(doc)}
      onPointerMove={spotlight}
    >
      <div className="doc-card__paper">
        <span className="doc-card__icon">{doc.icon || '📄'}</span>
        <p className={`doc-card__preview ${doc.preview ? '' : 'is-empty'}`}>
          {doc.preview || 'Empty document — click to start writing'}
        </p>
        <button
          type="button"
          className={`doc-card__star ${doc.starred ? 'is-on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            actions.star(doc);
          }}
          aria-label={doc.starred ? 'Unstar' : 'Star'}
        >
          <Star />
        </button>
      </div>

      <div className="doc-card__body">
        <h3 className="doc-card__title" title={doc.title}>
          {doc.title || 'Untitled document'}
        </h3>
        <div className="doc-card__meta">
          <Clock /> {editedLabel(doc, uid)}
        </div>
        <div className="doc-card__foot">
          <AvatarStack people={doc.members || []} max={3} size={24} />
          {!doc.isOwner && (
            <span className="badge">
              <Users /> Shared
            </span>
          )}
          <DocMenu doc={doc} actions={actions} />
        </div>
      </div>
    </article>
  );
}

function DocRow({ doc, index, uid, actions }) {
  return (
    <div
      className="doc-row animate-fade-up"
      style={{ '--i': Math.min(index, 12) }}
      tabIndex={0}
      role="button"
      onClick={() => actions.open(doc)}
      onKeyDown={(e) => e.key === 'Enter' && actions.open(doc)}
    >
      <span className="doc-row__name">
        <span className="doc-row__icon">{doc.icon || '📄'}</span>
        <span style={{ minWidth: 0 }}>
          <span className="doc-row__title">
            {doc.title || 'Untitled document'}
            {doc.starred && <Star className="doc-row__star" />}
          </span>
          <span className="doc-row__preview">{doc.preview || 'Empty document'}</span>
        </span>
      </span>
      <span className="doc-row__owner hide-sm">
        <Avatar name={doc.owner?.name} src={doc.owner?.picture} seed={doc.owner?.uid} size={22} />
        {doc.isOwner ? 'You' : firstName(doc.owner?.name)}
      </span>
      <span className="muted hide-sm">{editedLabel(doc, uid).replace('Edited ', '')}</span>
      <span className="muted hide-sm">{formatNumber(doc.wordCount)}</span>
      <span className="doc-row__actions">
        <DocMenu doc={doc} actions={actions} />
      </span>
    </div>
  );
}

function DocsSkeleton({ view }) {
  if (view === 'list') {
    return (
      <div className="doc-list card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="doc-row">
            <span className="skeleton" style={{ height: 34, width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="doc-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="doc-card doc-card--skeleton">
          <div className="skeleton" style={{ height: 150, borderRadius: '16px 16px 0 0' }} />
          <div style={{ padding: 16 }}>
            <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 12, width: '45%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

