// Vivid colours that read well on light AND dark paper.
export const USER_COLORS = [
  '#6d5efc',
  '#ff5fa2',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444',
  '#a34dff',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#84cc16',
  '#d946ef',
];

export function hashString(value = '') {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const colorFor = (seed) => USER_COLORS[hashString(String(seed || '')) % USER_COLORS.length];

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export const firstName = (name = '') => String(name).trim().split(/\s+/)[0] || 'there';

const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null;

export function timeAgo(input) {
  if (!input) return '';
  const date = new Date(input);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 45) return 'just now';
  if (!rtf) return date.toLocaleDateString();

  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
  ];

  if (abs < 3600) return rtf.format(Math.round(seconds / 60), units[0][0]);
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), units[1][0]);
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), units[2][0]);

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const modKey = isMac ? '⌘' : 'Ctrl';

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — ignore */
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export const formatNumber = (n) => new Intl.NumberFormat().format(n || 0);

export function slugify(value = 'document') {
  return (
    String(value)
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 80) || 'document'
  );
}

export function hasContent(json) {
  if (!json || !Array.isArray(json.content)) return false;
  return json.content.some((node) => (node.content && node.content.length) || node.type === 'horizontalRule');
}
