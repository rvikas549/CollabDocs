import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '../context/AuthContext';
import { docsApi } from '../lib/docsApi';
import { apiError } from '../config/api';
import { YJS_URL } from '../config/env';
import DocumentWorkspace from '../components/editor/DocumentWorkspace';
import NotFound from './NotFound';
import '../styles/editor.css';
import '../styles/prose.css';

const TOKEN_REFRESH_MS = 4 * 60 * 1000;

function EditorSkeleton() {
  return (
    <div className="workspace">
      <div className="ed-topbar">
        <div className="ed-topbar__left">
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 9 }} />
          <div className="skeleton" style={{ width: 220, height: 22 }} />
        </div>
        <div className="skeleton" style={{ width: 96, height: 36, borderRadius: 10 }} />
      </div>
      <div className="ed-body">
        <main className="ed-canvas">
          <div className="ed-page ed-page--loading">
            <div className="skeleton" style={{ width: '58%', height: 34, marginBottom: 28 }} />
            {[92, 88, 95, 70, 0, 84, 90, 62].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: `${w}%`, height: w ? 14 : 8, marginBottom: 14, opacity: w ? 1 : 0 }} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [load, setLoad] = useState({ status: 'loading', doc: null, error: '' });
  const [session, setSession] = useState(null);

  // 1) Load metadata through the API — this also adds the visitor as a collaborator.
  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading', doc: null, error: '' });

    docsApi
      .get(id)
      .then((doc) => !cancelled && setLoad({ status: 'ready', doc, error: '' }))
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.status;
        const status = code === 404 || code === 400 ? 'not-found' : code === 403 ? 'forbidden' : 'error';
        setLoad({ status, doc: null, error: apiError(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const readyId = load.status === 'ready' ? load.doc.id : null;

  // 2) Open the realtime connection once we know the document exists.
  useEffect(() => {
    if (!readyId) return undefined;

    let cancelled = false;
    let provider = null;
    let interval = null;
    const ydoc = new Y.Doc();

    // Tokens expire hourly; keep the reconnect URL fresh so drops recover silently.
    const refreshUrl = async () => {
      try {
        const token = await getToken();
        if (provider && token) provider.url = `${YJS_URL}/${readyId}?token=${encodeURIComponent(token)}`;
      } catch {
        /* next attempt will retry */
      }
    };

    getToken()
      .catch(() => null)
      .then((token) => {
        if (cancelled) return;
        provider = new WebsocketProvider(YJS_URL, readyId, ydoc, {
          params: token ? { token } : {},
          maxBackoffTime: 5000,
        });
        provider.on('status', ({ status }) => status === 'disconnected' && refreshUrl());
        interval = setInterval(refreshUrl, TOKEN_REFRESH_MS);
        setSession({ id: readyId, ydoc, provider });
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
      provider?.destroy();
      ydoc.destroy();
    };
  }, [readyId, getToken]);

  if (load.status === 'not-found') {
    return <NotFound title="Document not found" message="It may have been deleted, or the link is wrong." />;
  }
  if (load.status === 'forbidden') {
    return <NotFound title="No access" message="You don't have access to this document." />;
  }
  if (load.status === 'error') {
    return <NotFound title="Couldn't open document" message={load.error} />;
  }
  if (load.status !== 'ready' || !session || session.id !== load.doc.id) {
    return <EditorSkeleton />;
  }

  return <DocumentWorkspace key={session.id} doc={load.doc} ydoc={session.ydoc} provider={session.provider} />;
}
