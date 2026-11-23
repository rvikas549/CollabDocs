import { useId } from 'react';

export default function Logo({ size = 34, withText = false, subtitle }) {
  const gradientId = `logo-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <span className="logo">
      <svg className="logo-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6d5efc" />
            <stop offset=".55" stopColor="#a34dff" />
            <stop offset="1" stopColor="#ff5fa2" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        <path
          d="M13.5 9.5h9.2l6.3 6.3v13.4a2.3 2.3 0 0 1-2.3 2.3H13.5a2.3 2.3 0 0 1-2.3-2.3V11.8a2.3 2.3 0 0 1 2.3-2.3z"
          fill="#fff"
        />
        <path d="M22.7 9.5v4.6a1.7 1.7 0 0 0 1.7 1.7H29" fill="none" stroke="#d9d3ff" strokeWidth="1.4" />
        <rect x="14.6" y="19" width="10" height="2.2" rx="1.1" fill="#6d5efc" />
        <rect x="14.6" y="23.6" width="5.6" height="2.2" rx="1.1" fill="#c9c3f5" />
        <rect className="logo-caret" x="21.4" y="22.2" width="2" height="5.6" rx="1" fill="#ff5fa2" />
      </svg>
      {withText && (
        <span className="logo-text">
          <span className="logo-name">
            Collab<span className="text-gradient">Docs</span>
          </span>
          {subtitle && <span className="logo-sub">{subtitle}</span>}
        </span>
      )}
    </span>
  );
}
