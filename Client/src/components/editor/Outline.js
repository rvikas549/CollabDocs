import { useEffect, useState } from 'react';
import { ListTree, X } from 'lucide-react';

function collectHeadings(editor) {
  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.textContent.trim()) {
      headings.push({ level: node.attrs.level, text: node.textContent, pos });
    }
  });
  return headings;
}

export default function Outline({ editor, onClose }) {
  const [headings, setHeadings] = useState(() => collectHeadings(editor));
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHeadings(collectHeadings(editor)));
    };
    editor.on('update', update);
    return () => {
      cancelAnimationFrame(frame);
      editor.off('update', update);
    };
  }, [editor]);

  // Highlight the section currently in view.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = -1;
        headings.forEach((h, i) => {
          const dom = editor.view.nodeDOM(h.pos);
          if (dom instanceof HTMLElement && dom.getBoundingClientRect().top < 180) current = i;
        });
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [editor, headings]);

  const go = (heading) => {
    const dom = editor.view.nodeDOM(heading.pos);
    if (dom instanceof HTMLElement) {
      window.scrollTo({ top: window.scrollY + dom.getBoundingClientRect().top - 150, behavior: 'smooth' });
    }
    editor.chain().setTextSelection(heading.pos + 1).focus(undefined, { scrollIntoView: false }).run();
  };

  const minLevel = Math.min(...headings.map((h) => h.level), 3);

  return (
    <aside className="outline" aria-label="Document outline">
      <div className="outline-head">
        <ListTree />
        <span>Outline</span>
        <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close outline">
          <X />
        </button>
      </div>

      {headings.length === 0 ? (
        <p className="outline-empty">
          Add headings (type <kbd>#</kbd> + space) and they'll appear here for quick navigation.
        </p>
      ) : (
        <nav className="outline-list">
          {headings.map((h, i) => (
            <button
              type="button"
              key={`${h.pos}-${i}`}
              className={`outline-item ${i === active ? 'is-active' : ''}`}
              style={{ '--depth': h.level - minLevel }}
              onClick={() => go(h)}
              title={h.text}
            >
              {h.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
