import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { slugify } from '../lib/utils';

// ─── DOCX ───────────────────────────────────────────────

const HEADINGS = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };
const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};
const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList']);

const hex = (value) => {
  const match = String(value || '')
    .trim()
    .match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!match) return undefined;
  const raw = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  return raw.toUpperCase();
};

function runs(nodes = [], base = {}) {
  const out = [];

  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      out.push(new TextRun({ text: '', break: 1 }));
      continue;
    }
    if (node.type !== 'text') continue;

    const marks = Object.fromEntries((node.marks || []).map((m) => [m.type, m.attrs || {}]));
    const run = new TextRun({
      text: node.text,
      bold: Boolean(marks.bold || base.bold),
      italics: Boolean(marks.italic || base.italics),
      strike: Boolean(marks.strike || base.strike),
      underline: marks.underline || marks.link ? {} : undefined,
      color: hex(marks.textStyle?.color) || (marks.link ? '5848F0' : base.color),
      font: marks.code || base.code ? 'Consolas' : undefined,
      shading: marks.highlight
        ? { type: ShadingType.CLEAR, color: 'auto', fill: hex(marks.highlight.color) || 'FEF08A' }
        : marks.code
          ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F0F8' }
          : undefined,
    });

    out.push(marks.link?.href ? new ExternalHyperlink({ link: marks.link.href, children: [run] }) : run);
  }

  return out;
}

function createDocxBuilder() {
  let orderedInstance = 0;

  function list(node, level) {
    const kind = node.type;
    const instance = kind === 'orderedList' ? (orderedInstance += 1) : 0;
    const out = [];

    for (const item of node.content || []) {
      const checked = Boolean(item.attrs?.checked);

      (item.content || []).forEach((child, index) => {
        if (child.type === 'paragraph' && index === 0) {
          const options = { children: runs(child.content, kind === 'taskList' && checked ? { strike: true, color: '8B8D98' } : {}) };

          if (kind === 'bulletList') options.bullet = { level };
          if (kind === 'orderedList') options.numbering = { reference: 'ordered', level, instance };
          if (kind === 'taskList') {
            options.children.unshift(new TextRun({ text: checked ? '☑  ' : '☐  ' }));
            options.indent = { left: 360 * (level + 1) };
          }

          out.push(new Paragraph(options));
        } else if (LIST_TYPES.has(child.type)) {
          out.push(...list(child, Math.min(level + 1, 5)));
        } else {
          out.push(...block(child, { indent: { left: 720 * (level + 1) } }));
        }
      });
    }

    return out;
  }

  function block(node, extra = {}) {
    const alignment = ALIGN[node.attrs?.textAlign];

    switch (node.type) {
      case 'paragraph':
        return [new Paragraph({ children: runs(node.content), alignment, spacing: { after: 120 }, ...extra })];

      case 'heading':
        return [
          new Paragraph({
            heading: HEADINGS[node.attrs?.level] || HeadingLevel.HEADING_3,
            children: runs(node.content),
            alignment,
            ...extra,
          }),
        ];

      case 'bulletList':
      case 'orderedList':
      case 'taskList':
        return list(node, 0);

      case 'blockquote':
        return (node.content || []).flatMap((child) =>
          child.type === 'paragraph'
            ? [
                new Paragraph({
                  children: runs(child.content, { italics: true, color: '5F5A7A' }),
                  indent: { left: 540 },
                  border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'A197FF', space: 12 } },
                  spacing: { after: 120 },
                }),
              ]
            : block(child, { indent: { left: 540 } })
        );

      case 'codeBlock': {
        const text = (node.content || []).map((c) => c.text || '').join('');
        return text.split('\n').map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 20 })],
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F4F3FA' },
              spacing: { after: 0 },
            })
        );
      }

      case 'horizontalRule':
        return [
          new Paragraph({
            children: [],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D4D0E5', space: 1 } },
            spacing: { after: 200 },
          }),
        ];

      default:
        return node.content ? node.content.flatMap((child) => block(child, extra)) : [];
    }
  }

  return { block };
}

export async function exportDocx(editor, title = 'Document') {
  const json = editor.getJSON();
  const { block } = createDocxBuilder();
  const children = (json.content || []).flatMap((node) => block(node));

  const formats = [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN];

  const doc = new Document({
    creator: 'CollabDocs',
    title,
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    numbering: {
      config: [
        {
          reference: 'ordered',
          levels: [0, 1, 2, 3, 4, 5].map((level) => ({
            level,
            format: formats[level % 3],
            text: `%${level + 1}.`,
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [{ children: children.length ? children : [new Paragraph('')] }],
  });

  saveAs(await Packer.toBlob(doc), `${slugify(title)}.docx`);
}

// ─── Markdown ───────────────────────────────────────────

function mdInline(nodes = []) {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '  \n';
      let text = node.text || '';
      const marks = node.marks || [];
      const has = (type) => marks.some((m) => m.type === type);

      if (has('code')) text = `\`${text}\``;
      if (has('bold')) text = `**${text}**`;
      if (has('italic')) text = `_${text}_`;
      if (has('strike')) text = `~~${text}~~`;
      if (has('highlight')) text = `==${text}==`;

      const link = marks.find((m) => m.type === 'link');
      if (link?.attrs?.href) text = `[${text}](${link.attrs.href})`;
      return text;
    })
    .join('');
}

function mdBlock(node, indent = '') {
  switch (node.type) {
    case 'paragraph':
      return indent + mdInline(node.content);
    case 'heading':
      return `${'#'.repeat(node.attrs?.level || 1)} ${mdInline(node.content)}`;
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return (node.content || [])
        .map((item, i) => {
          const bullet =
            node.type === 'orderedList' ? `${i + 1}. ` : node.type === 'taskList' ? `- [${item.attrs?.checked ? 'x' : ' '}] ` : '- ';
          return (item.content || [])
            .map((child, j) =>
              j === 0 && child.type === 'paragraph'
                ? indent + bullet + mdInline(child.content)
                : mdBlock(child, `${indent}   `)
            )
            .join('\n');
        })
        .join('\n');
    case 'blockquote':
      return (node.content || [])
        .map((child) => mdBlock(child))
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language || ''}\n${(node.content || []).map((c) => c.text).join('')}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    default:
      return (node.content || []).map((child) => mdBlock(child, indent)).join('\n\n');
  }
}

export function toMarkdown(editor) {
  return `${(editor.getJSON().content || []).map((node) => mdBlock(node)).join('\n\n')}\n`;
}

export function exportMarkdown(editor, title = 'Document') {
  const blob = new Blob([toMarkdown(editor)], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${slugify(title)}.md`);
}

// ─── HTML ───────────────────────────────────────────────

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function exportHtml(editor, title = 'Document') {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { max-width: 760px; margin: 48px auto; padding: 0 24px; font: 17px/1.7 Inter, system-ui, sans-serif; color: #1d1b2e; }
  h1, h2, h3 { line-height: 1.25; letter-spacing: -0.02em; }
  blockquote { margin: 0; padding-left: 18px; border-left: 3px solid #a197ff; color: #5f5a7a; font-style: italic; }
  pre { padding: 16px; border-radius: 10px; background: #f4f3fa; overflow-x: auto; }
  code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.9em; }
  mark { border-radius: 3px; padding: 0 2px; }
  ul[data-type="taskList"] { list-style: none; padding-left: 4px; }
  ul[data-type="taskList"] li { display: flex; gap: 8px; }
  hr { border: 0; border-top: 1px solid #e6e3f1; margin: 28px 0; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`;
  saveAs(new Blob([html], { type: 'text/html;charset=utf-8' }), `${slugify(title)}.html`);
}

// ─── PDF (via the browser's print-to-PDF) ───────────────

export function exportPdf(title = 'Document') {
  const previous = document.title;
  document.title = slugify(title); // becomes the default PDF filename
  window.print();
  setTimeout(() => {
    document.title = previous;
  }, 500);
}
