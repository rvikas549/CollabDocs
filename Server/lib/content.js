const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'listItem',
  'taskItem',
  'horizontalRule',
]);

/** Flattens ProseMirror JSON into plain text, one line per block. */
export function extractText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'hardBreak') return '\n';

  const inner = Array.isArray(node.content) ? node.content.map(extractText).join('') : '';
  return BLOCK_TYPES.has(node.type) ? `${inner}\n` : inner;
}

export function summarise(content) {
  const text = extractText(content)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' · ');

  const wordCount = text ? text.replace(/·/g, ' ').split(/\s+/).filter(Boolean).length : 0;

  return {
    preview: text.slice(0, 280),
    wordCount,
  };
}

export const isProseMirrorDoc = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value) && value.type === 'doc';
