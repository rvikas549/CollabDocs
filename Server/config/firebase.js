import admin from 'firebase-admin';
import { config } from './env.js';

/**
 * Lazily initialises the Firebase Admin SDK.
 * Returns null when Firebase is not configured, so the server can still boot in dev-auth mode.
 *
 * Only FIREBASE_PROJECT_ID is required: ID-token verification uses Google's public keys.
 * FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY are optional (needed only for privileged calls).
 */
export function getFirebaseAdmin() {
  if (!config.firebase.enabled) return null;

  if (!admin.apps.length) {
    const { projectId, clientEmail, privateKey, hasServiceAccount } = config.firebase;
    admin.initializeApp(
      hasServiceAccount
        ? { projectId, credential: admin.credential.cert({ projectId, clientEmail, privateKey }) }
        : { projectId }
    );
  }

  return admin;
}
