import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Check,
  ChevronDown,
  Code,
  FileDown,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  ListTree,
  Maximize2,
  Minimize2,
  Minus,
  Pilcrow,
  Printer,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
} from 'lucide-react';
import Dropdown from '../ui/Dropdown';
import { modKey } from '../../lib/utils';

export const TEXT_COLORS = [
  { name: 'Default', value: null },
  { name: 'Gray', value: '#8b8d98' },
  { name: 'Red', value: '#e5484d' },
  { name: 'Orange', value: '#f76b15' },
  { name: 'Amber', value: '#d99a00' },
  { name: 'Green', value: '#30a46c' },
  { name: 'Teal', value: '#12a594' },
  { name: 'Blue', value: '#0090ff' },
  { name: 'Purple', value: '#8e4ec6' },
  { name: 'Pink', value: '#e93d82' },
];

export const HIGHLIGHTS = [
  { name: 'None', value: null },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
];

// Headings, quotes and code blocks can't live inside a list item — lift the line out first.
const lifted = (e) => {
  const c = e.chain().focus();
  return e.isActive('listItem') || e.isActive('taskItem') ? c.clearNodes() : c;
};

const BLOCKS = [
  { id: 'h1', label: 'Heading 1', icon: Heading1, active: (e) => e.isActive('heading', { level: 1 }), run: (e) => lifted(e).setNode('heading', { level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', icon: Heading2, active: (e) => e.isActive('heading', { level: 2 }), run: (e) => lifted(e).setNode('heading', { level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', icon: Heading3, active: (e) => e.isActive('heading', { level: 3 }), run: (e) => lifted(e).setNode('heading', { level: 3 }).run() },
  { id: 'code', label: 'Code block', icon: SquareCode, active: (e) => e.isActive('codeBlock'), run: (e) => lifted(e).toggleCodeBlock().run() },
  { id: 'quote', label: 'Quote', icon: Quote, active: (e) => e.isActive('blockquote'), run: (e) => lifted(e).toggleBlockquote().run() },
  { id: 'p', label: 'Normal text', icon: Pilcrow, active: () => true, run: (e) => e.chain().focus().setParagraph().run() },
];

// Detection order above matters (most specific first); this is the order shown in the menu.
const BLOCK_MENU = ['p', 'h1', 'h2', 'h3', 'quote', 'code'].map((id) => BLOCKS.find((b) => b.id === id));

const ALIGNMENTS = [
  { id: 'left', icon: AlignLeft, label: 'Align left' },
  { id: 'center', icon: AlignCenter, label: 'Align center' },
  { id: 'right', icon: AlignRight, label: 'Align right' },
  { id: 'justify', icon: AlignJustify, label: 'Justify' },
];

function Btn({ icon: Icon, label, shortcut, active, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`icon-btn tb-btn ${active ? 'is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      data-tip={shortcut ? `${label}  ${shortcut}` : label}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Icon />
    </button>
  );
}

export function Swatches({ colors, current, onPick, kind }) {
  return (
    <div className="swatches">
      {colors.map((c) => (
        <button
          type="button"
          key={c.name}
          className={`swatch ${kind} ${(current || null) === c.value ? 'is-active' : ''}`}
          style={{ '--swatch': c.value || 'transparent' }}
          onClick={() => onPick(c.value)}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={c.name}
          data-tip={c.name}
        >
          {kind === 'text' ? <span style={{ color: c.value || 'var(--text)' }}>A</span> : !c.value && <Minus />}
        </button>
      ))}
    </div>
  );
}

export default function Toolbar({ editor, onLink, onImport, onExport, outlineOpen, onToggleOutline, focusMode, onToggleFocus }) {
  const block = BLOCKS.find((b) => b.active(editor));
  const textColor = editor.getAttributes('textStyle').color;
  const highlight = editor.getAttributes('highlight').color;
  const align = ALIGNMENTS.find((a) => editor.isActive({ textAlign: a.id })) || ALIGNMENTS[0];

  return (
    <div className="toolbar-wrap">
      <div className="toolbar glass" role="toolbar" aria-label="Formatting">
        <div className="tb-group">
          <Btn icon={Undo2} label="Undo" shortcut={`${modKey}Z`} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
          <Btn icon={Redo2} label="Redo" shortcut={`${modKey}⇧Z`} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
        </div>

        <span className="divider-v" />

        <Dropdown
          align="left"
          width={210}
          trigger={({ toggle, open }) => (
            <button type="button" className={`tb-select ${open ? 'is-open' : ''}`} onClick={toggle} onMouseDown={(e) => e.preventDefault()}>
              <block.icon />
              <span>{block.label}</span>
              <ChevronDown className="tb-chevron" />
            </button>
          )}
        >
          {({ close }) =>
            BLOCK_MENU.map((b) => (
              <button
                type="button"
                key={b.id}
                className={`menu-item block-option block-option--${b.id} ${b.id === block.id ? 'is-selected' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  b.run(editor);
                  close();
                }}
              >
                <b.icon />
                <span>{b.label}</span>
                {b.id === block.id && <Check style={{ marginLeft: 'auto' }} />}
              </button>
            ))
          }
        </Dropdown>

        <span className="divider-v" />

        <div className="tb-group">
          <Btn icon={Bold} label="Bold" shortcut={`${modKey}B`} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
          <Btn icon={Italic} label="Italic" shortcut={`${modKey}I`} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <Btn icon={Underline} label="Underline" shortcut={`${modKey}U`} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <Btn icon={Strikethrough} label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
          <Btn icon={Code} label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
        </div>

        <span className="divider-v" />

        <div className="tb-group">
          <Dropdown
            align="left"
            width={236}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                className={`icon-btn tb-btn tb-color ${open ? 'is-active' : ''}`}
                onClick={toggle}
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Text colour"
                data-tip="Text colour"
              >
                <Baseline />
                <span className="tb-color__bar" style={{ background: textColor || 'var(--text)' }} />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <div className="menu-label">Text colour</div>
                <Swatches
                  kind="text"
                  colors={TEXT_COLORS}
                  current={textColor}
                  onPick={(value) => {
                    if (value) editor.chain().focus().setColor(value).run();
                    else editor.chain().focus().unsetColor().run();
                    close();
                  }}
                />
              </>
            )}
          </Dropdown>

          <Dropdown
            align="left"
            width={236}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                className={`icon-btn tb-btn tb-color ${open || editor.isActive('highlight') ? 'is-active' : ''}`}
                onClick={toggle}
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Highlight"
                data-tip={`Highlight  ${modKey}⇧H`}
              >
                <Highlighter />
                <span className="tb-color__bar" style={{ background: highlight || '#fef08a' }} />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <div className="menu-label">Highlight</div>
                <Swatches
                  kind="highlight"
                  colors={HIGHLIGHTS}
                  current={highlight}
                  onPick={(value) => {
                    if (value) editor.chain().focus().setHighlight({ color: value }).run();
                    else editor.chain().focus().unsetHighlight().run();
                    close();
                  }}
                />
              </>
            )}
          </Dropdown>

          <Btn icon={Link2} label="Link" shortcut={`${modKey}K`} active={editor.isActive('link')} onClick={onLink} />
        </div>

        <span className="divider-v hide-md" />

        <div className="tb-group hide-md">
          <Dropdown
            align="left"
            width={180}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                className={`icon-btn tb-btn ${open ? 'is-active' : ''}`}
                onClick={toggle}
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Alignment"
                data-tip="Alignment"
              >
                <align.icon />
              </button>
            )}
          >
            {({ close }) =>
              ALIGNMENTS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={`menu-item ${a.id === align.id ? 'is-selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setTextAlign(a.id).run();
                    close();
                  }}
                >
                  <a.icon /> {a.label}
                </button>
              ))
            }
          </Dropdown>
          <Btn icon={List} label="Bulleted list" shortcut={`${modKey}⇧8`} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <Btn icon={ListOrdered} label="Numbered list" shortcut={`${modKey}⇧7`} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Btn icon={ListTodo} label="Checklist" shortcut={`${modKey}⇧9`} active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} />
          <Btn icon={Minus} label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          <Btn icon={RemoveFormatting} label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />
        </div>

        <span className="tb-spacer" />

        <div className="tb-group">
          <Btn icon={Upload} label="Import (.docx, .md, .html, .txt)" onClick={onImport} />

          <Dropdown
            width={230}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                className={`icon-btn tb-btn ${open ? 'is-active' : ''}`}
                onClick={toggle}
                aria-label="Export"
                data-tip="Export"
              >
                <FileDown />
              </button>
            )}
          >
            {({ close }) => {
              const pick = (format) => () => {
                close();
                onExport(format);
              };
              return (
                <>
                  <div className="menu-label">Download as</div>
                  <button type="button" className="menu-item" onClick={pick('docx')}>
                    <FileText /> Word document <span className="menu-hint">.docx</span>
                  </button>
                  <button type="button" className="menu-item" onClick={pick('pdf')}>
                    <Printer /> PDF <span className="menu-hint">{modKey}P</span>
                  </button>
                  <button type="button" className="menu-item" onClick={pick('md')}>
                    <FileText /> Markdown <span className="menu-hint">.md</span>
                  </button>
                  <button type="button" className="menu-item" onClick={pick('html')}>
                    <FileText /> Web page <span className="menu-hint">.html</span>
                  </button>
                </>
              );
            }}
          </Dropdown>

          <span className="divider-v" />

          <Btn icon={ListTree} label="Outline" shortcut={`${modKey}\\`} active={outlineOpen} onClick={onToggleOutline} />
          <Btn
            icon={focusMode ? Minimize2 : Maximize2}
            label={focusMode ? 'Exit focus mode' : 'Focus mode'}
            shortcut={`${modKey}⇧F`}
            active={focusMode}
            onClick={onToggleFocus}
          />
        </div>
      </div>
    </div>
  );
}
