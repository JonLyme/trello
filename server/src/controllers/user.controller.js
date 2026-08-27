import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { toPublicUser } from '../utils/user.js';

const ALLOWED_ROLES = new Set(['admin', 'user']);
const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const removeStoredFile = (folder, name) => name && fs.unlink(path.join(publicDir, folder, name), () => {});

function parseUserId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function listUsers(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, avatar_originalName, avatar_url, created_at, updated_at, resume_originalName, resume_url
     FROM users
     ORDER BY created_at DESC, id DESC`,
  );

  return res.json({ users: rows.map(toPublicUser) });
}

export async function updateUser(req, res) {
  const userId = parseUserId(req.params.id);
  if (!userId) {
    return res.status(400).json({ message: 'Invalid user ID.' });
  }

  const [existingRows] = await pool.execute(
    `SELECT id, name, email, role, is_active, avatar_originalName, avatar_url, resume_originalName, resume_url, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  if (existingRows.length === 0) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const existing = existingRows[0];
  const nextName = req.body?.name === undefined ? existing.name : String(req.body.name).trim();
  const nextRole = req.body?.role === undefined ? existing.role : String(req.body.role);
  const nextIsActive = req.body?.isActive === undefined
    ? Boolean(existing.is_active)
    : req.body.isActive === true;

  if (nextName.length < 2 || nextName.length > 100) {
    return res.status(400).json({ message: 'Name must contain between 2 and 100 characters.' });
  }

  if (!ALLOWED_ROLES.has(nextRole)) {
    return res.status(400).json({ message: 'Role must be either admin or user.' });
  }

  if (userId === req.user.id && (nextRole !== 'admin' || !nextIsActive)) {
    return res.status(400).json({
      message: 'You cannot demote or deactivate your own administrator account.',
    });
  }

  await pool.execute(
    `UPDATE users
     SET name = ?, role = ?, is_active = ?
     WHERE id = ?`,
    [nextName, nextRole, nextIsActive, userId],
  );

  const [updatedRows] = await pool.execute(
    `SELECT id, name, email, role, is_active, avatar_originalName, avatar_url, resume_originalName, resume_url, created_at, updated_at
     FROM users
     WHERE id = ?`,
    [userId],
  );

  return res.json({
    message: 'User updated successfully.',
    user: toPublicUser(updatedRows[0]),
  });
}

export async function deleteUser(req, res, next) {
  const userId = parseUserId(req.params.id);
  if (!userId) return res.status(400).json({ message: 'Invalid user ID.' });
  if (userId === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account.' });

  const connection = await pool.getConnection();
  let files = { avatar: '', resume: '', workplaceImages: [] };
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute(
      'SELECT avatar_storedName, resume_storedName FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
      [userId],
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }
    const [workplaces] = await connection.execute(
      'SELECT image_storedName FROM workplaces WHERE user_id = ? FOR UPDATE',
      [userId],
    );
    files = {
      avatar: users[0].avatar_storedName || '',
      resume: users[0].resume_storedName || '',
      workplaceImages: workplaces.map((item) => item.image_storedName).filter(Boolean),
    };
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }

  removeStoredFile('avatar', files.avatar);
  removeStoredFile('resume', files.resume);
  files.workplaceImages.forEach((name) => removeStoredFile('symbol', name));
  return res.json({ message: 'User deleted successfully.' });
}
