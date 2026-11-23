import { useState } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { Bold, Check, Code, Heading1, Heading2, Highlighter, Italic, Link2, Strikethrough, Underline, Unlink } from 'lucide-react';

function normaliseUrl(raw) {
  const value = raw.trim();
  if (!value) return '';
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(value)) return `mailto:${value}`;
  return `https://${value.replace(/^\/+/, '')}`;
}

function LinkForm({ editor, onDone }) {
  const [url, setUrl] = useState(editor.getAttributes('link').href || '');

  const apply = (event) => {
    event.preventDefault();
    const href = normaliseUrl(url);
    const chain = editor.chain().focus().extendMarkRange('link');
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    onDone();
  };

  return (
    <form className="bubble-link" onSubmit={apply}>
      <Link2 />
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a link…"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onDone();
            editor.commands.focus();
          }
        }}
      />
      <button type="submit" className="icon-btn icon-btn-sm" aria-label="Apply link">
        <Check />
      </button>
      {editor.isActive('link') && (
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          aria-label="Remove link"
          onClick={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            onDone();
          }}
        >
          <Unlink />
        </button>
      )}
    </form>
  );
}

export default function BubbleToolbar({ editor, linkMode, setLinkMode }) {
  const item = (Icon, label, active, run) => (
    <button
      type="button"
      className={`bubble-btn ${active ? 'is-active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      aria-label={label}
      title={label}
    >
      <Icon />
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, maxWidth: 'none', placement: 'top', onHidden: () => setLinkMode(false) }}
      // Captured once by TipTap, so it must not depend on React state.
      shouldShow={({ editor: e, state }) => {
        if (!e.isEditable || state.selection.empty) return false;
        if (e.isActive('codeBlock')) return false;
        return state.doc.textBetween(state.selection.from, state.selection.to).trim().length > 0;
      }}
    >
      <div className="bubble">
        {linkMode ? (
          <LinkForm editor={editor} onDone={() => setLinkMode(false)} />
        ) : (
          <>
            {item(Bold, 'Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
            {item(Italic, 'Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
            {item(Underline, 'Underline', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run())}
            {item(Strikethrough, 'Strikethrough', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run())}
            {item(Code, 'Code', editor.isActive('code'), () => editor.chain().focus().toggleCode().run())}
            <span className="bubble-sep" />
            {item(Highlighter, 'Highlight', editor.isActive('highlight'), () =>
              editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()
            )}
            {item(Link2, 'Link', editor.isActive('link'), () => setLinkMode(true))}
            <span className="bubble-sep" />
            {item(Heading1, 'Heading 1', editor.isActive('heading', { level: 1 }), () =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            )}
            {item(Heading2, 'Heading 2', editor.isActive('heading', { level: 2 }), () =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            )}
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
