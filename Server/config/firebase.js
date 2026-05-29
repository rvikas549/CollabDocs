import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
console.log(process.env.FIREBASE_PROJECT_ID);
console.log(process.env.FIREBASE_CLIENT_EMAIL);
const serviceAccount = {
  projectId:
    process.env.FIREBASE_PROJECT_ID,

  clientEmail:
    process.env.FIREBASE_CLIENT_EMAIL,

  privateKey:
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      '\n'
    ),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential:
      admin.credential.cert(
        serviceAccount
      ),
  });
}

export default admin;