import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import multer from 'multer';
import { getMe, signIn, signUp } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../public/avatar');
fs.mkdirSync(uploadDir, { recursive: true });
const extensionByMime = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({ destination: (_req, _file, cb) => cb(null, uploadDir), filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${extensionByMime[file.mimetype] || ''}`) }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => extensionByMime[file.mimetype] ? cb(null, true) : cb(new Error('Use a JPEG, PNG, or WebP avatar.')),
});
const parseOptionalAvatar = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  return upload.single('avatar')(req, res, next);
};

router.post('/signup', parseOptionalAvatar, signUp);
router.post('/signin', signIn);
router.get('/me', requireAuth, getMe);
export default router;
