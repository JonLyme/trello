import { pool } from '../config/db.js';
import { verifyAccessToken } from '../utils/token.js';
import { toPublicUser } from '../utils/user.js';

const PUBLIC_USER_COLUMNS = `id, name, email, role, is_active,
  avatar_originalName, avatar_url,
  resume_originalName, resume_url, created_at, updated_at`;

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication token is required.' });
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) return res.status(401).json({ message: 'Invalid authentication token.' });
    const [rows] = await pool.execute(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [userId]);
    if (rows.length === 0 || !rows[0].is_active) return res.status(401).json({ message: 'The account is unavailable or inactive.' });
    req.user = toPublicUser(rows[0]);
    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    if (error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError') return res.status(401).json({ message: 'Invalid authentication token.' });
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  return next();
}
