import admin from '../config/firebase.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // No token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    next();
  } catch (err) {
    console.error(err);

    return res.status(401).json({
      error: 'Invalid token',
    });
  }
}