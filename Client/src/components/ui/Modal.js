import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert, X } from 'lucide-react';

export function Modal({ onClose, children, size, label }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey, true);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ icon: Icon, tone, title, subtitle, onClose }) {
  return (
    <div className="modal-head">
      {Icon && (
        <div className={`modal-icon ${tone === 'danger' ? 'danger' : ''}`}>
          <Icon />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="modal-title">{title}</h2>
        {subtitle && <p className="modal-sub">{subtitle}</p>}
      </div>
      {onClose && (
        <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close">
          <X />
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  icon = TriangleAlert,
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onCancel} label={title}>
      <ModalHeader icon={icon} tone={tone} title={title} subtitle={message} />
      <div className="modal-actions" style={{ paddingTop: 18 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          onClick={confirm}
          disabled={busy}
          autoFocus
        >
          {busy && <span className="spinner" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function PromptDialog({ title, subtitle, label, initialValue = '', placeholder, confirmLabel = 'Save', icon, onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(value.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={busy ? undefined : onCancel} label={title}>
      <form onSubmit={submit}>
        <ModalHeader icon={icon} title={title} subtitle={subtitle} onClose={onCancel} />
        <div className="modal-body">
          <label className="field">
            {label && <span className="field-label">{label}</span>}
            <input
              className="input"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()}
              maxLength={200}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy && <span className="spinner" />}
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
