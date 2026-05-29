import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

const credential =
  process.env.FIREBASE_PROJECT_ID
    ? {
        projectId:
          process.env.FIREBASE_PROJECT_ID,
        clientEmail:
          process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:
          process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
          ),
      }
    : serviceAccount;

if (!admin.apps.length) {
  admin.initializeApp({
    credential:
      admin.credential.cert(
        credential
      ),
  });
}

export default admin;