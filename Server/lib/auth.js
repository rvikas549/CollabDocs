import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getFirebaseAdmin } from '../config/firebase.js';

const DEV_ISSUER = 'collabdocs-dev';

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.status = 401;
  }
}

export const isAuthConfigured = () => config.firebase.enabled || config.devAuth.enabled;

const fallbackName = (email) => (email ? email.split('@')[0] : 'Anonymous');

/** Issues a signed token for local development (never available in production). */
export function issueDevToken({ name, email }) {
  const cleanName = String(name || '').trim().slice(0, 60);
  const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 120);
  const seed = cleanEmail || cleanName.toLowerCase();
  const uid = `dev-${crypto.createHash('sha256').update(seed).digest('hex').slice(0, 24)}`;

  const user = {
    uid,
    name: cleanName || fallbackName(cleanEmail),
    email: cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'guest'}@local.dev`,
    picture: null,
  };

  const token = jwt.sign(
    { name: user.name, email: user.email },
    config.devAuth.secret,
    { subject: uid, issuer: DEV_ISSUER, expiresIn: '30d' }
  );

  return { token, user };
}

/**
 * Verifies either a Firebase ID token or (in dev mode) a locally issued JWT.
 * Resolves to a normalised user: { uid, name, email, picture }.
 */
export async function verifyAuthToken(token) {
  if (!token) throw new AuthError('Missing token');

  if (config.devAuth.enabled) {
    try {
      const payload = jwt.verify(token, config.devAuth.secret, { issuer: DEV_ISSUER });
      return {
        uid: payload.sub,
        name: payload.name || fallbackName(payload.email),
        email: payload.email || null,
        picture: null,
      };
    } catch {
      // Not a dev token — fall through to Firebase if it is configured.
    }
  }

  const firebase = getFirebaseAdmin();
  if (firebase) {
    try {
      const decoded = await firebase.auth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        name: decoded.name || fallbackName(decoded.email),
        email: decoded.email || null,
        picture: decoded.picture || null,
      };
    } catch {
      throw new AuthError('Invalid or expired token');
    }
  }

  throw new AuthError(
    isAuthConfigured() ? 'Invalid or expired token' : 'Authentication is not configured on the server'
  );
}
