import bcrypt from 'bcryptjs';
import fs from 'fs';
import { pool } from '../config/db.js';
import { createAccessToken } from '../utils/token.js';
import { toPublicUser } from '../utils/user.js';
import { extractSignUpFields, isValidEmail, normalizeEmail, validateSignUp } from '../utils/auth-validation.js';
const PUBLIC_USER_COLUMNS = `id, name, email, role, is_active,
  avatar_originalName, avatar_url,
  resume_originalName, resume_url, created_at, updated_at`;
const removeFile = (filePath) => filePath && fs.unlink(filePath, () => {});

export async function signUp(req, res, next) {
  const signUpFields = extractSignUpFields(req.body || {});
  const { errors, cleanName, cleanEmail, cleanPassword } = validateSignUp(signUpFields);
  if (errors.length) { removeFile(req.file?.path); return res.status(400).json({ message: errors[0], errors }); }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [cleanEmail]);
    if (existing.length) { await connection.rollback(); removeFile(req.file?.path); return res.status(409).json({ message: 'That email address is already registered.' }); }
    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM users');
    const role = Number(countRows[0].total) === 0 ? 'admin' : 'user';
    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    const avatarUrl = req.file ? `/avatar/${encodeURIComponent(req.file.filename)}` : '';
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, avatar_originalName, avatar_storedName, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash, role, req.file?.originalname || '', req.file?.filename || '', avatarUrl],
    );
    const [rows] = await connection.execute(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
    await connection.commit();
    const user = toPublicUser(rows[0]);
    return res.status(201).json({
      message: role === 'admin' ? 'Account created. As the first registered user, you are the administrator.' : 'Account created successfully.',
      token: createAccessToken(user),
      user,
    });
  } catch (error) {
    await connection.rollback();
    removeFile(req.file?.path);
    return next(error);
  } finally { connection.release(); }
}

export async function signIn(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!isValidEmail(email) || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' });
  const [rows] = await pool.execute(`SELECT ${PUBLIC_USER_COLUMNS}, password_hash FROM users WHERE email = ? LIMIT 1`, [email]);
  if (!rows.length) return res.status(401).json({ message: 'Email or password is incorrect.' });
  const account = rows[0];
  if (!(await bcrypt.compare(password, account.password_hash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  if (!account.is_active) return res.status(403).json({ message: 'This account has been deactivated.' });
  const user = toPublicUser(account);
  return res.json({ message: 'Signed in successfully.', token: createAccessToken(user), user });
}

export function getMe(req, res) { return res.json({ user: req.user }); }
