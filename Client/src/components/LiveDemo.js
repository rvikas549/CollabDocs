import { useEffect, useState } from 'react';

const LINES = [
  { name: 'Maya', color: '#ff5fa2', text: 'Launch plan — mobile app v2 🚀', kind: 'heading', start: 0, speed: 2 },
  { name: 'Leo', color: '#19c3a6', text: 'Ship the beta to 500 early users', kind: 'task', start: 18, speed: 2 },
  { name: 'You', color: '#6d5efc', text: 'Draft the press release and share it here', kind: 'text', start: 34, speed: 2 },
];

const TICK_MS = 45;
const total = Math.max(...LINES.map((l) => l.start + l.text.length * l.speed));
const LOOP = total + 70; // pause before replaying

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function LiveDemo() {
  const [tick, setTick] = useState(() => (prefersReducedMotion() ? total : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setTick((t) => (t + 1) % LOOP), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="demo" aria-hidden="true">
      <div className="demo-bar">
        <span className="demo-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="demo-file">📝 Q3 Launch Plan</span>
        <span className="demo-live">
          <span className="live-dot" /> 3 editing
        </span>
      </div>

      <div className="demo-page">
        {LINES.map((line) => {
          const typed = Math.max(0, Math.min(line.text.length, Math.floor((tick - line.start) / line.speed)));
          const typing = typed > 0 && typed < line.text.length;
          const done = typed === line.text.length;

          return (
            <div key={line.name} className={`demo-line demo-line--${line.kind}`}>
              {line.kind === 'task' && <span className={`demo-check ${done ? 'is-done' : ''}`} />}
              <span className="demo-text">{line.text.slice(0, typed)}</span>
              <span className={`demo-caret ${typing ? 'is-typing' : ''}`} style={{ '--c': line.color }}>
                <span className="demo-flag">{line.name}</span>
              </span>
            </div>
          );
        })}
        <div className="demo-skel" style={{ width: '92%' }} />
        <div className="demo-skel" style={{ width: '74%' }} />
        <div className="demo-skel" style={{ width: '58%' }} />
      </div>
    </div>
  );
}
