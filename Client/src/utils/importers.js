export const IMPORT_ACCEPT = '.docx,.md,.markdown,.html,.htm,.txt';

const IMPORTABLE = /\.(docx|md|markdown|html?|txt)$/i;

export const isImportable = (file) => Boolean(file && IMPORTABLE.test(file.name));

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const safeHref = (href) => (/^(https?:|mailto:)/i.test(href) ? href : null);

function inlineMarkdown(text) {
  const codes = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\uE000${codes.length - 1}\uE000`;
  });

  out = out
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const safe = safeHref(href.replace(/&amp;/g, '&'));
      return safe ? `<a href="${escapeHtml(safe)}">${label}</a>` : label;
    })
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a, b) => `<strong>${a || b}</strong>`)
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>');

  return out.replace(/\uE000(\d+)\uE000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

/** Small, dependency-free Markdown → HTML converter covering the blocks the editor supports. */
export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const isBlockStart = (line) =>
    /^(#{1,6}\s|>|```|\s*[-*+]\s|\s*\d+[.)]\s)/.test(line) || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const code = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html.push('<hr>');
      i += 1;
      continue;
    }

    if (/^>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote><p>${inlineMarkdown(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+\[( |x|X)\]\s*/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+\[( |x|X)\]\s*/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*+]\s+\[( |x|X)\]\s*(.*)$/);
        items.push(`<li data-type="taskItem" data-checked="${m[1].trim() ? 'true' : 'false'}"><p>${inlineMarkdown(m[2])}</p></li>`);
        i += 1;
      }
      html.push(`<ul data-type="taskList">${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i]) && !/^\s*[-*+]\s+\[( |x|X)\]/.test(lines[i])) {
        items.push(`<li><p>${inlineMarkdown(lines[i].replace(/^\s*[-*+]\s+/, ''))}</p></li>`);
        i += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(`<li><p>${inlineMarkdown(lines[i].replace(/^\s*\d+[.)]\s+/, ''))}</p></li>`);
        i += 1;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
  }

  return html.join('');
}

/** Converts an uploaded file into HTML the editor can ingest. */
export async function fileToHtml(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.docx')) {
    const { default: mammoth } = await import('mammoth');
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    return value;
  }

  const text = await file.text();

  if (/\.html?$/.test(name)) {
    // DOMParser documents are inert (no scripts run); the editor schema strips anything unsupported.
    return new DOMParser().parseFromString(text, 'text/html').body.innerHTML;
  }

  if (/\.(md|markdown)$/.test(name)) return markdownToHtml(text);

  if (name.endsWith('.txt')) {
    return text
      .replace(/\r\n?/g, '\n')
      .split(/\n{2,}/)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  throw new Error('Unsupported file — use .docx, .md, .html or .txt');
}
