import express from 'express';
import { config } from '../config/env.js';
import { issueDevToken } from '../lib/auth.js';
import { verifyToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';

const router = express.Router();

/** Lets the client know which sign-in methods the server will accept. */
router.get('/config', (req, res) => {
  res.json({
    firebase: config.firebase.enabled,
    dev: config.devAuth.enabled,
  });
});

/** Local-only sign in. Disabled unless DEV_AUTH=true and NODE_ENV is not production. */
router.post('/dev-login', (req, res, next) => {
  if (!config.devAuth.enabled) return next(new HttpError(404, 'Dev login is disabled'));

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();

  if (name.length < 2) return next(new HttpError(400, 'Please enter your name (at least 2 characters)'));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new HttpError(400, 'That email address looks invalid'));
  }

  res.json(issueDevToken({ name, email }));
});

router.get('/me', verifyToken, (req, res) => {
  res.json(req.user);
});

export default router;
