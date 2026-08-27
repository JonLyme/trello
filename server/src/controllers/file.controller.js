import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const resumeDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/resume');
const removeFile = (storedName) => storedName && fs.unlink(path.join(resumeDir, storedName), () => {});

export async function uploadResume(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'Please select a PDF file.' });
  const connection = await pool.getConnection();
  let previousStoredName = '';
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT resume_storedName FROM users WHERE id = ? LIMIT 1 FOR UPDATE', [req.user.id]);
    if (!rows.length) {
      await connection.rollback();
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'User not found.' });
    }
    previousStoredName = rows[0].resume_storedName || '';
    const url = `/resume/${encodeURIComponent(req.file.filename)}`;
    await connection.execute('UPDATE users SET resume_originalName = ?, resume_storedName = ?, resume_url = ? WHERE id = ?', [req.file.originalname, req.file.filename, url, req.user.id]);
    await connection.commit();
    if (previousStoredName && previousStoredName !== req.file.filename) removeFile(previousStoredName);
    return res.status(201).json({ message: 'Resume uploaded successfully.', originalName: req.file.originalname, name: req.file.originalname, url });
  } catch (error) {
    await connection.rollback();
    fs.unlink(req.file.path, () => {});
    return next(error);
  } finally {
    connection.release();
  }
}
