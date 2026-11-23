import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal accessible dropdown.
 * `trigger` and `children` are render functions receiving { open, toggle, close }.
 */
export default function Dropdown({ trigger, children, align = 'right', width, className = '', placement = 'bottom' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointer = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const api = { open, toggle, close };
  const position = placement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' };

  return (
    <div className={`dropdown ${className}`} ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger(api)}
      {open && (
        <div className="popover" data-align={align} role="menu" style={{ [align]: 0, ...position, width }}>
          {children(api)}
        </div>
      )}
    </div>
  );
}
