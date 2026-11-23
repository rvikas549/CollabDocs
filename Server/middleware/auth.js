import { verifyAuthToken } from '../lib/auth.js';

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  try {
    req.user = await verifyAuthToken(token);
    next();
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message || 'Unauthorized' });
  }
}
