import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { ySyncPluginKey } from 'y-prosemirror';
import {
  CircleAlert,
  CloudCheck,
  CloudOff,
  FileDown,
  Keyboard,
  Link2,
  ListTree,
  Maximize2,
  Minimize2,
  Printer,
  Share2,
  Star,
  Upload,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCommands } from '../CommandPalette';
import { docsApi, docUrl } from '../../lib/docsApi';
import { apiError } from '../../config/api';
import { API_URL } from '../../config/env';
import { colorFor, copyText, formatNumber, hasContent, modKey, readStorage, timeAgo, writeStorage } from '../../lib/utils';
import { exportDocx, exportHtml, exportMarkdown, exportPdf } from '../../utils/exporters';
import { fileToHtml, IMPORT_ACCEPT, isImportable } from '../../utils/importers';
import Logo from '../ui/Logo';
import { AvatarStack } from '../ui/Avatar';
import { Modal, ModalHeader } from '../ui/Modal';
import ProfileMenu from '../ProfileMenu';
import ShortcutsModal from '../ShortcutsModal';
import Toolbar from './Toolbar';
import BubbleToolbar from './BubbleToolbar';
import Outline from './Outline';
import ShareModal from './ShareModal';
import EmojiPicker from './EmojiPicker';
import { SlashCommand } from './SlashCommand';
import { jumpToPeer, useConnection, usePresence } from './hooks';

const CONTENT_SAVE_DELAY = 1200;
const TITLE_SAVE_DELAY = 600;

function SaveStatus({ save, status }) {
  if (status === 'offline' || status === 'disconnected') {
    return (
      <span className="save-status is-offline">
        <CloudOff /> Offline
      </span>
    );
  }
  if (save.state === 'error') {
    return (
      <span className="save-status is-error" title={save.message}>
        <CircleAlert /> Not saved, retrying
      </span>
    );
  }
  if (save.state === 'pending' || save.state === 'saving') {
    return (
      <span className="save-status is-saving">
        <span className="spinner" /> Saving...
      </span>
    );
  }
  return (
    <span className="save-status is-saved">
      <CloudCheck /> Saved {timeAgo(save.at)}
    </span>
  );
}

function ConnectionPill({ status, synced, count }) {
  const live = status === 'connected' && synced;
  const label = live ? (count ? `${count + 1} editing` : 'Live') : status === 'offline' ? 'Offline' : 'Connecting...';
  const tone = live ? 'is-live' : status === 'offline' ? 'is-offline' : 'is-connecting';

  return (
    <span className={`conn-pill ${tone}`} data-tip={live ? 'Changes sync instantly' : 'Reconnecting to the realtime server…'}>
      <span className="conn-dot" />
      {label}
    </span>
  );
}

export default function DocumentWorkspace({ doc, ydoc, provider }) {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const me = useMemo(
    () => ({ uid: user.uid, name: user.displayName, picture: user.photoURL, color: colorFor(user.uid) }),
    [user]
  );
  const meta = useMemo(() => ydoc.getMap('meta'), [ydoc]);

  const [title, setTitle] = useState(doc.title);
  const [icon, setIcon] = useState(doc.icon || '📄');
  const [starred, setStarred] = useState(Boolean(doc.starred));
  const [save, setSave] = useState({ state: 'saved', at: Date.parse(doc.updatedAt) || Date.now() });
  const [linkMode, setLinkMode] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(() => readStorage('collabdocs.outline', window.innerWidth > 1280 ? '1' : '0') === '1');
  const [focusMode, setFocusMode] = useState(false);
  const [modal, setModal] = useState(null);
  const [dragging, setDragging] = useState(false);

  const { status, synced } = useConnection(provider);
  const peers = usePresence(provider, user.uid);

  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);
  const linkShortcutRef = useRef(() => {});
  const titleTimer = useRef(null);
  const contentTimer = useRef(null);
  const pendingContent = useRef(false);
  const tokenRef = useRef(null);

  // ─── editor ────────────────────────────────────────────

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false, heading: { levels: [1, 2, 3] } }),
        Underline,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Typography,
        CharacterCount,
        Placeholder.configure({
          placeholder: ({ node }) =>
            node.type.name === 'heading' ? `Heading ${node.attrs.level}` : "Type '/' for commands, or just start writing…",
        }),
        SlashCommand,
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({ provider, user: me }),
      ],
      editorProps: {
        attributes: { class: 'prose', spellcheck: 'true', 'aria-label': 'Document body' },
        handleKeyDown: (view, event) => {
          const mod = event.metaKey || event.ctrlKey;
          if (mod && !event.shiftKey && event.key.toLowerCase() === 'k' && !view.state.selection.empty) {
            event.preventDefault();
            linkShortcutRef.current();
            return true;
          }
          return false;
        },
      },
    },
    [ydoc, provider]
  );

  // ─── persistence (REST snapshot for dashboard previews, search and exports) ──

  const persist = useCallback(
    async (patch) => {
      setSave((s) => ({ ...s, state: 'saving' }));
      try {
        await docsApi.update(doc.id, patch);
        setSave({ state: 'saved', at: Date.now() });
      } catch (err) {
        setSave({ state: 'error', at: Date.now(), message: apiError(err) });
      }
    },
    [doc.id]
  );

  const flushContent = useCallback(() => {
    clearTimeout(contentTimer.current);
    if (!pendingContent.current || !editor || editor.isDestroyed) return Promise.resolve();
    pendingContent.current = false;
    return persist({ content: editor.getJSON() });
  }, [editor, persist]);

  useEffect(() => {
    if (!editor) return undefined;

    const onUpdate = ({ transaction }) => {
      // Remote edits are saved by their author; local undo/redo still counts as ours.
      const ySync = transaction.getMeta(ySyncPluginKey);
      if (ySync?.isChangeOrigin && !ySync?.isUndoRedoOperation) return;

      pendingContent.current = true;
      setSave((s) => (s.state === 'pending' ? s : { ...s, state: 'pending' }));
      clearTimeout(contentTimer.current);
      contentTimer.current = setTimeout(flushContent, CONTENT_SAVE_DELAY);
    };

    editor.on('update', onUpdate);
    return () => editor.off('update', onUpdate);
  }, [editor, flushContent]);

  // Flush when leaving the page (best effort — the realtime server already has every keystroke).
  useEffect(() => {
    const refreshToken = () =>
      getToken()
        .then((t) => {
          tokenRef.current = t;
        })
        .catch(() => {});
    refreshToken();
    const interval = setInterval(refreshToken, 4 * 60 * 1000);

    const onPageHide = () => {
      if (!pendingContent.current || !editor || editor.isDestroyed) return;
      pendingContent.current = false;
      fetch(`${API_URL}/documents/${doc.id}`, {
        method: 'PATCH',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}) },
        body: JSON.stringify({ content: editor.getJSON() }),
      }).catch(() => {});
    };

    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', onPageHide);
      flushContent();
    };
  }, [doc.id, editor, flushContent, getToken]);

  // ─── shared title + icon (live via Yjs, persisted via REST) ──

  useEffect(() => {
    const sync = () => {
      const t = meta.get('title');
      const i = meta.get('icon');
      if (typeof t === 'string') setTitle(t);
      if (typeof i === 'string') setIcon(i);
    };
    sync();
    meta.observe(sync);
    return () => meta.unobserve(sync);
  }, [meta]);

  // Once synced: seed empty realtime docs from the saved snapshot (templates, legacy docs)
  // and reconcile the title with any rename made from the dashboard.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!editor || !synced || seededRef.current) return;
    seededRef.current = true;

    if (ydoc.getXmlFragment('default').length === 0 && !meta.get('seeded') && hasContent(doc.content)) {
      meta.set('seeded', true);
      editor.commands.setContent(doc.content);
    }

    const restAt = doc.titleUpdatedAt ? Date.parse(doc.titleUpdatedAt) : 0;
    const metaTitle = meta.get('title');
    if (typeof metaTitle !== 'string' || restAt > (meta.get('titleAt') || 0)) {
      ydoc.transact(() => {
        meta.set('title', doc.title);
        meta.set('titleAt', restAt || Date.now());
      });
    } else if (metaTitle.trim() && metaTitle !== doc.title) {
      docsApi.update(doc.id, { title: metaTitle }).catch(() => {});
    }

    if (typeof meta.get('icon') !== 'string') meta.set('icon', doc.icon || '📄');
  }, [editor, synced, ydoc, meta, doc]);

  useEffect(() => {
    document.title = `${title.trim() || 'Untitled document'} · CollabDocs`;
  }, [title]);

  const onTitleChange = (value) => {
    setTitle(value);
    ydoc.transact(() => {
      meta.set('title', value);
      meta.set('titleAt', Date.now());
    });
    setSave((s) => ({ ...s, state: 'pending' }));
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => persist({ title: value }), TITLE_SAVE_DELAY);
  };

  const onIconChange = (value) => {
    setIcon(value);
    meta.set('icon', value);
    persist({ icon: value });
  };

  // ─── actions ───────────────────────────────────────────

  const toggleStar = useCallback(async () => {
    const next = !starred;
    setStarred(next);
    try {
      await docsApi.star(doc.id, next);
      toast.success(next ? 'Added to starred' : 'Removed from starred');
    } catch (err) {
      setStarred(!next);
      toast.error(apiError(err));
    }
  }, [starred, doc.id, toast]);

  const onExport = useCallback(
    async (format) => {
      if (!editor) return;
      const name = title.trim() || 'Untitled document';
      try {
        if (format === 'docx') {
          await exportDocx(editor, name);
          toast.success('Word document downloaded');
        } else if (format === 'pdf') {
          exportPdf(name);
        } else if (format === 'md') {
          exportMarkdown(editor, name);
          toast.success('Markdown downloaded');
        } else if (format === 'html') {
          exportHtml(editor, name);
          toast.success('Web page downloaded');
        }
      } catch (err) {
        toast.error(`Export failed: ${err.message}`);
      }
    },
    [editor, title, toast]
  );

  const applyImport = useCallback(
    (html, how, name) => {
      if (how === 'replace') editor.chain().focus().setContent(html, true).run();
      else editor.chain().focus().insertContent(html).run();
      setModal(null);
      toast.success(`Imported “${name}”`);
    },
    [editor, toast]
  );

  const startImport = useCallback(
    async (file) => {
      if (!isImportable(file)) {
        toast.error('Unsupported file — use .docx, .md, .html or .txt');
        return;
      }
      try {
        const html = await fileToHtml(file);
        if (editor.isEmpty) applyImport(html, 'replace', file.name);
        else setModal({ type: 'import', html, name: file.name });
      } catch (err) {
        toast.error(err.message || 'Could not read that file');
      }
    },
    [editor, applyImport, toast]
  );

  const openLink = useCallback(() => {
    if (!editor || editor.state.selection.empty) {
      toast.info('Select some text first, then add a link');
      return;
    }
    setLinkMode(true);
  }, [editor, toast]);
  linkShortcutRef.current = openLink;

  const onPeerClick = (peer) => {
    if (!jumpToPeer(editor, provider, peer)) toast.info(`${peer.name} hasn't placed their cursor yet`);
  };

  useEffect(() => writeStorage('collabdocs.outline', outlineOpen ? '1' : '0'), [outlineOpen]);

  // ─── keyboard shortcuts ───────────────────────────────

  const latest = useRef({});
  latest.current = { focusMode, modal, title, flushContent, onExport };

  useEffect(() => {
    const onKey = (event) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && key === 's') {
        event.preventDefault();
        latest.current.flushContent();
        toast.success('Saved');
      } else if (mod && event.key === '/') {
        event.preventDefault();
        setModal((m) => (m === 'shortcuts' ? null : 'shortcuts'));
      } else if (mod && event.key === '\\') {
        event.preventDefault();
        setOutlineOpen((o) => !o);
      } else if (mod && event.shiftKey && key === 'f') {
        event.preventDefault();
        setFocusMode((f) => !f);
      } else if (mod && !event.shiftKey && key === 'p') {
        event.preventDefault();
        latest.current.onExport('pdf');
      } else if (event.key === 'Escape' && latest.current.focusMode && !latest.current.modal) {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toast]);

  // ─── command palette ──────────────────────────────────

  const actionsRef = useRef({});
  actionsRef.current = { toggleStar, onExport };

  const commands = useMemo(
    () => [
      { id: 'ed-share', group: 'This document', title: 'Share document', icon: Share2, keywords: 'invite link collaborate people', run: () => setModal('share') },
      {
        id: 'ed-copy',
        group: 'This document',
        title: 'Copy document link',
        icon: Link2,
        keywords: 'url share',
        run: async () => {
          await copyText(docUrl(doc.id));
          toast.success('Link copied');
        },
      },
      { id: 'ed-docx', group: 'This document', title: 'Export as Word (.docx)', icon: FileDown, keywords: 'download word docx', run: () => actionsRef.current.onExport('docx') },
      { id: 'ed-pdf', group: 'This document', title: 'Export as PDF', icon: Printer, keywords: 'download print pdf', shortcut: `${modKey}P`, run: () => actionsRef.current.onExport('pdf') },
      { id: 'ed-md', group: 'This document', title: 'Export as Markdown', icon: FileDown, keywords: 'download md markdown', run: () => actionsRef.current.onExport('md') },
      { id: 'ed-html', group: 'This document', title: 'Export as HTML', icon: FileDown, keywords: 'download web html', run: () => actionsRef.current.onExport('html') },
      { id: 'ed-import', group: 'This document', title: 'Import a file…', icon: Upload, keywords: 'upload docx word markdown', run: () => fileInputRef.current?.click() },
      { id: 'ed-outline', group: 'This document', title: 'Toggle outline', icon: ListTree, keywords: 'headings toc sidebar', shortcut: `${modKey}\\`, run: () => setOutlineOpen((o) => !o) },
      { id: 'ed-focus', group: 'This document', title: 'Toggle focus mode', icon: Maximize2, keywords: 'zen distraction free', shortcut: `${modKey}⇧F`, run: () => setFocusMode((f) => !f) },
      { id: 'ed-star', group: 'This document', title: 'Star / unstar document', icon: Star, keywords: 'favorite favourite', run: () => actionsRef.current.toggleStar() },
      { id: 'ed-keys', group: 'This document', title: 'Keyboard shortcuts', icon: Keyboard, shortcut: `${modKey}/`, run: () => setModal('shortcuts') },
    ],
    [doc.id, toast]
  );
  useCommands('editor', commands);

  // ─── drag & drop import ───────────────────────────────

  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

  const dropHandlers = {
    onDragEnter: (event) => {
      if (!hasFiles(event)) return;
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (event) => {
      if (hasFiles(event)) event.preventDefault();
    },
    onDragLeave: (event) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (!dragDepth.current) setDragging(false);
    },
    onDropCapture: (event) => {
      dragDepth.current = 0;
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file && isImportable(file)) {
        event.preventDefault();
        event.stopPropagation();
        startImport(file);
      }
    },
  };

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const characters = editor.storage.characterCount.characters();
  const peerList = peers.map((p) => ({ ...p, tip: `${p.name} · jump to cursor` }));

  return (
    <div className={`workspace ${focusMode ? 'is-focus' : ''} ${outlineOpen ? 'has-outline' : ''}`}>
      <header className="ed-topbar">
        <div className="ed-topbar__left">
          <button type="button" className="ed-home" onClick={() => navigate('/')} aria-label="Back to documents" data-tip="All documents">
            <Logo size={30} />
          </button>

          <EmojiPicker value={icon} onChange={onIconChange} />

          <div className="ed-titleblock">
            <input
              className="ed-title"
              value={title}
              placeholder="Untitled document"
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => !title.trim() && onTitleChange('Untitled document')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editor.commands.focus('start');
                }
              }}
              style={{ width: `${Math.min(Math.max((title || 'Untitled document').length, 8), 40) + 2}ch` }}
              maxLength={200}
              spellCheck={false}
              aria-label="Document title"
            />
            <div className="ed-meta">
              <SaveStatus save={save} status={status} />
            </div>
          </div>

          <button
            type="button"
            className={`icon-btn ed-star ${starred ? 'is-on' : ''}`}
            onClick={toggleStar}
            aria-label={starred ? 'Unstar document' : 'Star document'}
            data-tip={starred ? 'Starred' : 'Star'}
          >
            <Star />
          </button>
        </div>

        <div className="ed-topbar__right">
          <ConnectionPill status={status} synced={synced} count={peers.length} />
          {peers.length > 0 && <AvatarStack people={peerList} ringed max={4} size={32} onSelect={onPeerClick} />}
          <button type="button" className="btn btn-primary" onClick={() => setModal('share')}>
            <Share2 />
            <span className="hide-sm">Share</span>
          </button>
          <ProfileMenu onShowShortcuts={() => setModal('shortcuts')} />
        </div>
      </header>

      <Toolbar
        editor={editor}
        onLink={openLink}
        onImport={() => fileInputRef.current?.click()}
        onExport={onExport}
        outlineOpen={outlineOpen}
        onToggleOutline={() => setOutlineOpen((o) => !o)}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((f) => !f)}
      />

      <div className="ed-body">
        {outlineOpen && <Outline editor={editor} onClose={() => setOutlineOpen(false)} />}

        <main className="ed-canvas" {...dropHandlers}>
          <div className="ed-page">
            <EditorContent editor={editor} />
          </div>

          {dragging && (
            <div className="drop-overlay">
              <div className="drop-overlay__card">
                <Upload />
                <strong>Drop to import</strong>
                <span>.docx · .md · .html · .txt</span>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="ed-status">
        <span>
          <b>{formatNumber(words)}</b> words
        </span>
        <span className="hide-sm">
          <b>{formatNumber(characters)}</b> characters
        </span>
        <span>~{Math.max(1, Math.ceil(words / 230))} min read</span>
      </div>

      {focusMode && (
        <button type="button" className="focus-exit" onClick={() => setFocusMode(false)}>
          <Minimize2 /> Exit focus <kbd>esc</kbd>
        </button>
      )}

      <BubbleToolbar editor={editor} linkMode={linkMode} setLinkMode={setLinkMode} />

      <input
        ref={fileInputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) startImport(file);
        }}
      />

      {modal === 'share' && (
        <ShareModal docId={doc.id} title={title} owner={doc.owner} members={doc.members} peers={peers} me={me} onClose={() => setModal(null)} />
      )}

      {modal === 'shortcuts' && <ShortcutsModal onClose={() => setModal(null)} />}

      {modal?.type === 'import' && (
        <Modal onClose={() => setModal(null)} label="Import file">
          <ModalHeader
            icon={Upload}
            title={`Import “${modal.name}”`}
            subtitle="This document already has content. How should the file be added?"
            onClose={() => setModal(null)}
          />
          <div className="modal-actions" style={{ paddingTop: 18, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-soft" onClick={() => applyImport(modal.html, 'insert', modal.name)}>
              Insert at cursor
            </button>
            <button type="button" className="btn btn-primary" onClick={() => applyImport(modal.html, 'replace', modal.name)}>
              Replace document
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
