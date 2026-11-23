/**
 * CollabDocs realtime server.
 *
 * - Speaks the y-websocket protocol (document sync + awareness for live cursors).
 * - Persists every document to MongoDB (debounced) and restores it on first open.
 * - Verifies the same auth tokens as the REST API before accepting a socket.
 */
import { config, describeAuth } from './config/env.js';

import http from 'http';
import { createRequire } from 'module';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { verifyAuthToken, isAuthConfigured } from './lib/auth.js';
import YDocModel from './models/YDoc.js';
import DocumentModel from './models/Document.js';

// y-websocket's server utils are CommonJS and `require('yjs')` internally.
// Load Yjs the same way so both share ONE instance (avoids "Yjs was already imported").
const require = createRequire(import.meta.url);
const Y = require('yjs');
const { setupWSConnection, setPersistence, getYDoc, docs } = require('y-websocket/bin/utils');

const DOC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SAVE_DEBOUNCE_MS = 1500;

const saveTimers = new Map();
const loadState = new WeakMap(); // ydoc -> Promise<boolean> (true when safe to persist)

// ─── persistence ────────────────────────────────────────

async function persist(docName, ydoc) {
  // Never overwrite stored state with a partially loaded document.
  const safe = await loadState.get(ydoc);
  if (!safe) return;

  // Skip documents that were deleted while someone still had them open.
  if (!(await DocumentModel.exists({ _id: docName }))) return;

  const data = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  await YDocModel.updateOne({ docName }, { $set: { data } }, { upsert: true });
}

function schedulePersist(docName, ydoc) {
  clearTimeout(saveTimers.get(docName));
  saveTimers.set(
    docName,
    setTimeout(() => {
      saveTimers.delete(docName);
      persist(docName, ydoc).catch((err) => console.error(`[yjs] save failed for ${docName}:`, err.message));
    }, SAVE_DEBOUNCE_MS)
  );
}

setPersistence({
  provider: null,

  bindState: (docName, ydoc) => {
    // Listen first so edits that arrive while loading are still saved.
    ydoc.on('update', () => schedulePersist(docName, ydoc));

    const loading = YDocModel.findOne({ docName })
      .then((stored) => {
        if (stored?.data?.length) {
          Y.applyUpdate(ydoc, new Uint8Array(stored.data));
          console.log(`[yjs] restored ${docName} (${stored.data.length} bytes)`);
        }
        return true;
      })
      .catch((err) => {
        console.error(`[yjs] could not load ${docName}; persistence disabled for this session:`, err.message);
        return false;
      });

    loadState.set(ydoc, loading);
    return loading;
  },

  writeState: async (docName, ydoc) => {
    clearTimeout(saveTimers.get(docName));
    saveTimers.delete(docName);
    await persist(docName, ydoc).catch((err) =>
      console.error(`[yjs] final save failed for ${docName}:`, err.message)
    );
  },
});

// ─── http + websocket ───────────────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        openDocuments: docs.size,
        connections: wss.clients.size,
      })
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CollabDocs realtime server is running');
});

const wss = new WebSocketServer({ noServer: true });

function reject(socket, status, message) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

server.on('upgrade', async (req, socket, head) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return reject(socket, 400, 'Bad Request');
  }

  const docName = decodeURIComponent(url.pathname.slice(1));
  if (!DOC_ID_RE.test(docName)) return reject(socket, 400, 'Bad Request');

  let user = null;
  if (isAuthConfigured()) {
    try {
      user = await verifyAuthToken(url.searchParams.get('token'));
    } catch {
      return reject(socket, 401, 'Unauthorized');
    }
  }

  try {
    if (!(await DocumentModel.exists({ _id: docName }))) return reject(socket, 404, 'Not Found');
  } catch (err) {
    console.error('[yjs] document lookup failed:', err.message);
    return reject(socket, 503, 'Service Unavailable');
  }

  // Finish restoring from MongoDB *before* syncing, so a client never sees an
  // empty document first (which would make it re-seed and duplicate content).
  const ydoc = getYDoc(docName, true);
  await loadState.get(ydoc);

  wss.handleUpgrade(req, socket, head, (ws) => {
    setupWSConnection(ws, req, { docName, gc: true });
    if (!config.isProduction) {
      console.log(`[yjs] ${user?.name || 'anonymous'} joined ${docName.slice(0, 8)}… (${wss.clients.size} online)`);
    }
  });
});

server.listen(config.yjsPort, '0.0.0.0', () => {
  console.log(`[yjs] Realtime server listening on ws://localhost:${config.yjsPort}`);
  if (isAuthConfigured()) {
    console.log(`[yjs] Socket auth: ${describeAuth()}`);
  } else {
    console.warn('[yjs] ⚠ No auth configured — anyone with a document id can connect.');
  }
});

connectDB('yjs').catch(() => {
  console.error('[yjs] Continuing without a database — documents will not persist until MongoDB is reachable.');
});

// Flush pending saves before exiting so a deploy/restart never drops the last edits.
async function shutdown(signal) {
  console.log(`[yjs] ${signal} received, saving ${docs.size} open document(s)…`);
  for (const timer of saveTimers.values()) clearTimeout(timer);
  await Promise.allSettled([...docs.entries()].map(([name, doc]) => persist(name, doc)));
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
