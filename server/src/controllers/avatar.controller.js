import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { toPublicUser } from '../utils/user.js';

const avatarDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/avatar');
const PUBLIC_USER_COLUMNS = `id, name, email, role, is_active, avatar_originalName, avatar_url, resume_originalName, resume_url, created_at, updated_at`;
function removeStoredAvatar(name) { if (name) fs.unlink(path.join(avatarDir, name), () => {}); }

export async function uploadAvatar(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Please select an avatar image.' });
  const connection = await pool.getConnection();
  let previous = '';
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT avatar_storedName FROM users WHERE id = ? LIMIT 1 FOR UPDATE', [req.user.id]);
    if (!existing.length) { await connection.rollback(); fs.unlink(req.file.path, () => {}); return res.status(404).json({ message: 'User not found.' }); }
    previous = existing[0].avatar_storedName || '';
    const avatarUrl = `/avatar/${encodeURIComponent(req.file.filename)}`;
    await connection.execute('UPDATE users SET avatar_originalName = ?, avatar_storedName = ?, avatar_url = ? WHERE id = ?', [req.file.originalname, req.file.filename, avatarUrl, req.user.id]);
    const [rows] = await connection.execute(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [req.user.id]);
    await connection.commit();
    if (previous && previous !== req.file.filename) removeStoredAvatar(previous);
    return res.status(201).json({ message: 'Avatar updated successfully.', user: toPublicUser(rows[0]) });
  } catch (error) {
    await connection.rollback();
    fs.unlink(req.file.path, () => {});
    return next(error);
  } finally { connection.release(); }
}
