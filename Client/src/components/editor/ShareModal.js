import { useMemo, useState } from 'react';
import { Check, Copy, Globe, Share2 } from 'lucide-react';
import { Modal, ModalHeader } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { copyText } from '../../lib/utils';
import { docUrl } from '../../lib/docsApi';

export default function ShareModal({ docId, title, owner, members = [], peers = [], me, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = docUrl(docId);

  const people = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.uid, { ...m }));
    peers.forEach((p) => {
      if (!p.uid) return;
      map.set(p.uid, { ...(map.get(p.uid) || {}), uid: p.uid, name: p.name, picture: p.picture, color: p.color, online: true });
    });
    const list = [...map.values()];
    return list.sort((a, b) => {
      const rank = (x) => (x.uid === owner?.uid ? 0 : x.uid === me.uid ? 1 : x.online ? 2 : 3);
      return rank(a) - rank(b);
    });
  }, [members, peers, owner, me]);

  const copy = async () => {
    await copyText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal onClose={onClose} label="Share document">
      <ModalHeader icon={Share2} title={`Share “${title || 'Untitled document'}”`} subtitle="Invite people by sending them the link." onClose={onClose} />

      <div className="modal-body">
        <div className="share-link">
          <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Document link" />
          <button type="button" className={`btn btn-sm ${copied ? 'btn-soft' : 'btn-primary'}`} onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="share-note">
          <Globe />
          <span>
            <b>Anyone with the link</b> can open and edit this document after signing in.
          </span>
        </div>

        <div className="share-people">
          <div className="menu-label" style={{ padding: '0 0 8px' }}>
            People with access · {people.length}
          </div>
          <ul>
            {people.map((p) => (
              <li key={p.uid}>
                <span className="share-avatar">
                  <Avatar name={p.name} src={p.picture} seed={p.uid} size={34} />
                  {p.online && <span className="online-dot" style={{ background: p.color || 'var(--success)' }} />}
                </span>
                <span className="share-person">
                  <span className="share-name">
                    {p.name}
                    {p.uid === me.uid && <span className="muted"> (you)</span>}
                  </span>
                  <span className="share-email">{p.online ? 'Editing now' : p.email || 'Has access'}</span>
                </span>
                <span className={`badge ${p.uid === owner?.uid ? 'badge-brand' : ''}`}>{p.uid === owner?.uid ? 'Owner' : 'Editor'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
