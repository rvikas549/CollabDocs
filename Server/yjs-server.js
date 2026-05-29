import { WebSocketServer } from 'ws';
import http from 'http';
import * as Y from 'yjs';
import {
  setupWSConnection,
} from 'y-websocket/bin/utils';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import YDocModel from './models/YDoc.js';

dotenv.config();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      'MongoDB connected for Yjs persistence'
    );
  })
  .catch(console.error);

const server = http.createServer();

const wss = new WebSocketServer({
  server,
});

// In-memory docs cache
const docs = new Map();

// Load document from MongoDB
async function loadDocument(docName) {
  let ydoc = docs.get(docName);

  if (ydoc) {
    return ydoc;
  }

  ydoc = new Y.Doc();

  // Load saved binary state
  const existing =
    await YDocModel.findOne({
      docName,
    });

  if (existing) {
    const uint8 =
      new Uint8Array(existing.data);

    Y.applyUpdate(ydoc, uint8);

    console.log(
      `Loaded persisted doc: ${docName}`
    );
  }

  // Persist updates automatically
  ydoc.on(
    'update',
    async (update) => {
      try {
        const merged =
          Y.encodeStateAsUpdate(ydoc);

        await YDocModel.findOneAndUpdate(
          { docName },
          {
            data: Buffer.from(
              merged
            ),
          },
          {
            upsert: true,
          }
        );

        console.log(
          `Saved doc: ${docName}`
        );
      } catch (err) {
        console.error(
          'Persistence error:',
          err
        );
      }
    }
  );

  docs.set(docName, ydoc);

  return ydoc;
}

// WebSocket connection
wss.on(
  'connection',
  async (conn, req) => {
    const docName =
      req.url.slice(1).split('?')[0];

    const ydoc =
      await loadDocument(docName);

    setupWSConnection(conn, req, {
      doc: ydoc,
      gc: true,
    });
  }
);

const PORT = 1234;

server.listen(PORT, () => {
  console.log(
    `Yjs WebSocket server running on ${PORT}`
  );
});