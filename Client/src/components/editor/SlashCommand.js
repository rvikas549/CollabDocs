import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import {
  CalendarDays,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
  SquareCode,
} from 'lucide-react';

const chain = ({ editor, range }) => editor.chain().focus().deleteRange(range);

// Headings, quotes and code blocks can't live inside a list item — lift the line out first.
const block = (ctx) => {
  const c = chain(ctx);
  return ctx.editor.isActive('listItem') || ctx.editor.isActive('taskItem') ? c.clearNodes() : c;
};

export const SLASH_ITEMS = [
  {
    group: 'Basic blocks',
    title: 'Text',
    description: 'Just start writing plain text',
    icon: Pilcrow,
    keywords: 'paragraph plain normal',
    run: (ctx) => chain(ctx).setParagraph().run(),
  },
  {
    group: 'Basic blocks',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
    keywords: 'h1 title large',
    run: (ctx) => block(ctx).setNode('heading', { level: 1 }).run(),
  },
  {
    group: 'Basic blocks',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    keywords: 'h2 subtitle',
    run: (ctx) => block(ctx).setNode('heading', { level: 2 }).run(),
  },
  {
    group: 'Basic blocks',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    keywords: 'h3',
    run: (ctx) => block(ctx).setNode('heading', { level: 3 }).run(),
  },
  {
    group: 'Lists',
    title: 'Bulleted list',
    description: 'A simple bulleted list',
    icon: List,
    keywords: 'ul unordered bullet points',
    run: (ctx) => chain(ctx).toggleBulletList().run(),
  },
  {
    group: 'Lists',
    title: 'Numbered list',
    description: 'A list with numbering',
    icon: ListOrdered,
    keywords: 'ol ordered numbers steps',
    run: (ctx) => chain(ctx).toggleOrderedList().run(),
  },
  {
    group: 'Lists',
    title: 'To-do list',
    description: 'Track tasks with checkboxes',
    icon: ListTodo,
    keywords: 'task checkbox checklist todo',
    run: (ctx) => chain(ctx).toggleTaskList().run(),
  },
  {
    group: 'Blocks',
    title: 'Quote',
    description: 'Capture a quotation',
    icon: Quote,
    keywords: 'blockquote citation callout',
    run: (ctx) => block(ctx).toggleBlockquote().run(),
  },
  {
    group: 'Blocks',
    title: 'Code block',
    description: 'Monospaced code snippet',
    icon: SquareCode,
    keywords: 'code snippet pre programming',
    run: (ctx) => block(ctx).toggleCodeBlock().run(),
  },
  {
    group: 'Blocks',
    title: 'Divider',
    description: 'Visually separate sections',
    icon: Minus,
    keywords: 'hr horizontal rule line separator',
    run: (ctx) => chain(ctx).setHorizontalRule().run(),
  },
  {
    group: 'Insert',
    title: "Today's date",
    description: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    icon: CalendarDays,
    keywords: 'date now time today calendar',
    run: (ctx) =>
      chain(ctx)
        .insertContent(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
        .run(),
  },
  {
    group: 'Insert',
    title: 'Highlight',
    description: 'Make the next words pop',
    icon: Highlighter,
    keywords: 'mark yellow emphasis important',
    run: (ctx) => chain(ctx).setHighlight({ color: '#fef08a' }).run(),
  },
];

function filterItems(query) {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => item.title.toLowerCase().includes(q) || item.keywords.includes(q));
}

const SlashMenu = forwardRef(function SlashMenu({ items, command }, ref) {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => setIndex(0), [items]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false;
      if (event.key === 'ArrowDown') {
        setIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setIndex((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        command(items[index]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="slash-menu">
        <div className="slash-empty">No matching blocks</div>
      </div>
    );
  }

  let lastGroup = null;

  return (
    <div className="slash-menu" ref={listRef} role="listbox">
      {items.map((item, i) => {
        const header = item.group !== lastGroup ? item.group : null;
        lastGroup = item.group;
        const Icon = item.icon;
        return (
          <div key={item.title}>
            {header && <div className="slash-group">{header}</div>}
            <button
              type="button"
              data-index={i}
              role="option"
              aria-selected={i === index}
              className={`slash-item ${i === index ? 'is-active' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(item)}
            >
              <span className="slash-item__icon">
                <Icon />
              </span>
              <span className="slash-item__text">
                <span className="slash-item__title">{item.title}</span>
                <span className="slash-item__desc">{item.description}</span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
});

function renderMenu() {
  let component = null;
  let element = null;

  const place = (rect) => {
    if (!rect || !element) return;
    const height = element.offsetHeight || 340;
    const width = element.offsetWidth || 300;
    const below = rect.bottom + 8;
    const top = below + height > window.innerHeight - 12 ? Math.max(12, rect.top - height - 8) : below;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
  };

  return {
    onStart: (props) => {
      component = new ReactRenderer(SlashMenu, { props, editor: props.editor });
      element = component.element;
      element.className = 'slash-root';
      document.body.appendChild(element);
      requestAnimationFrame(() => place(props.clientRect?.()));
    },
    onUpdate: (props) => {
      component?.updateProps(props);
      if (element) element.style.display = '';
      requestAnimationFrame(() => place(props.clientRect?.()));
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        if (element) element.style.display = 'none';
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      element?.remove();
      component?.destroy();
      component = null;
      element = null;
    },
  };
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('slashCommand'),
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        // Don't trigger inside code blocks.
        allow: ({ state }) => !state.selection.$from.parent.type.spec.code,
        items: ({ query }) => filterItems(query),
        command: ({ editor, range, props }) => props.run({ editor, range }),
        render: renderMenu,
      }),
    ];
  },
});
