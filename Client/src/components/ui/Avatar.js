import { useState } from 'react';
import { colorFor, initials } from '../../lib/utils';

export function Avatar({ name, src, seed, size = 32, color, ring, title, className = '' }) {
  const [failed, setFailed] = useState(false);
  const base = color || colorFor(seed || name);

  return (
    <span
      className={`avatar ${ring ? 'has-ring' : ''} ${className}`}
      title={title ?? name}
      style={{
        '--size': `${size}px`,
        '--avatar-bg': `linear-gradient(135deg, ${base}, ${base}b3)`,
        ...(ring ? { '--ring-color': ring } : {}),
      }}
    >
      {src && !failed ? (
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function AvatarStack({ people = [], max = 4, size = 28, ringed = false, onSelect }) {
  const visible = people.slice(0, max);
  const extra = people.length - visible.length;

  return (
    <div className="avatar-stack">
      {visible.map((p) => {
        const avatar = (
          <Avatar
            name={p.name}
            src={p.picture}
            seed={p.uid}
            size={size}
            color={p.color}
            ring={ringed ? p.color : undefined}
            title={p.title ?? p.name}
          />
        );
        return onSelect ? (
          <button key={p.key || p.uid} type="button" className="avatar-btn" onClick={() => onSelect(p)} data-tip={p.tip || p.name}>
            {avatar}
          </button>
        ) : (
          <span key={p.key || p.uid}>{avatar}</span>
        );
      })}
      {extra > 0 && (
        <span className="avatar avatar-more" style={{ '--size': `${size}px` }} title={people.slice(max).map((p) => p.name).join(', ')}>
          +{extra}
        </span>
      )}
    </div>
  );
}
