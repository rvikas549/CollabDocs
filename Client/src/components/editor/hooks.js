import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { relativePositionToAbsolutePosition, ySyncPluginKey } from 'y-prosemirror';

/** Live connection + sync state of the y-websocket provider. */
export function useConnection(provider) {
  const [status, setStatus] = useState(provider.wsconnected ? 'connected' : 'connecting');
  const [synced, setSynced] = useState(provider.synced);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const onStatus = ({ status: next }) => setStatus(next);
    const onSync = (isSynced) => setSynced(isSynced);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    provider.on('status', onStatus);
    provider.on('sync', onSync);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      provider.off('status', onStatus);
      provider.off('sync', onSync);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [provider]);

  return { status: online ? status : 'offline', synced };
}

/** Everyone else in the document right now (one entry per person, even with several tabs). */
export function usePresence(provider, myUid) {
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    const { awareness } = provider;

    const update = () => {
      const people = new Map();
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID || !state.user) return;
        if (state.user.uid && state.user.uid === myUid) return;
        const key = state.user.uid || String(clientId);
        if (!people.has(key)) people.set(key, { ...state.user, key, clientId });
      });
      setPeers([...people.values()]);
    };

    update();
    awareness.on('change', update);
    return () => awareness.off('change', update);
  }, [provider, myUid]);

  return peers;
}

/** Scrolls to a collaborator's live cursor. Returns false if they have no cursor in the doc. */
export function jumpToPeer(editor, provider, peer) {
  const state = provider.awareness.getStates().get(peer.clientId);
  const head = state?.cursor?.head;
  const sync = ySyncPluginKey.getState(editor.state);
  if (!head || !sync?.binding) return false;

  const pos = relativePositionToAbsolutePosition(
    sync.doc,
    sync.type,
    Y.createRelativePositionFromJSON(head),
    sync.binding.mapping
  );
  if (pos == null) return false;

  const coords = editor.view.coordsAtPos(Math.min(pos, editor.state.doc.content.size));
  window.scrollTo({ top: window.scrollY + coords.top - window.innerHeight / 3, behavior: 'smooth' });

  // Briefly flash their caret so it's easy to spot.
  const name = peer.name;
  document.querySelectorAll('.collaboration-cursor__caret').forEach((caret) => {
    if (caret.textContent === name) {
      caret.classList.remove('is-flashing');
      // eslint-disable-next-line no-unused-expressions
      caret.offsetWidth; // restart animation
      caret.classList.add('is-flashing');
    }
  });
  return true;
}
