import { config, describeAuth } from './config/env.js';

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { backfillLegacyDocuments } from './lib/migrations.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: config.allowAnyOrigin ? true : config.clientUrls,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);
app.use(express.json({ limit: '5mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 1500,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests — please slow down for a moment.' },
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: describeAuth(),
    uptime: Math.round(process.uptime()),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

server.listen(config.apiPort, () => {
  console.log(`[api] CollabDocs API listening on http://localhost:${config.apiPort}`);
  console.log(`[api] Auth mode: ${describeAuth()}`);
  console.log(`[api] Allowed origins: ${config.allowAnyOrigin ? '*' : config.clientUrls.join(', ')}`);
});

connectDB('api')
  .then(() => backfillLegacyDocuments())
  .then((count) => count && console.log(`[api] Upgraded ${count} legacy document(s) with previews`))
  .catch((err) => {
    console.error('[api] Startup database step failed:', err.message);
  });

function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down…`);
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
