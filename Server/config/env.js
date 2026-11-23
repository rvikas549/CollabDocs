import dotenv from 'dotenv';

dotenv.config();

const truthy = (value) =>
  ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase());

const isProduction = process.env.NODE_ENV === 'production';

const firebase = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  // Render / .env files store the key with escaped newlines.
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
// Verifying sign-in tokens only needs the project id (Google's public keys do the rest).
// A service account is optional and only required for privileged Admin SDK calls.
firebase.enabled = Boolean(firebase.projectId);
firebase.hasServiceAccount = Boolean(firebase.clientEmail && firebase.privateKey);

const devAuthRequested = truthy(process.env.DEV_AUTH);
if (devAuthRequested && isProduction) {
  console.error('[config] DEV_AUTH=true is ignored because NODE_ENV=production.');
}

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const config = {
  isProduction,
  apiPort: Number(process.env.PORT) || 4000,
  // On Render the Yjs service gets its own PORT; locally it runs beside the API.
  yjsPort: Number(process.env.RENDER ? process.env.PORT : process.env.YJS_PORT) || 1234,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collabdocs',
  clientUrls,
  allowAnyOrigin: clientUrls.includes('*'),
  firebase,
  devAuth: {
    enabled: devAuthRequested && !isProduction,
    secret: process.env.DEV_AUTH_SECRET || 'collabdocs-local-dev-secret',
  },
};

export function describeAuth() {
  const modes = [];
  if (config.firebase.enabled) {
    modes.push(config.firebase.hasServiceAccount ? 'firebase' : 'firebase (project id only)');
  }
  if (config.devAuth.enabled) modes.push('dev');
  return modes.length ? modes.join(' + ') : 'NONE (no Firebase credentials and DEV_AUTH is off)';
}
