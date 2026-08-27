import { Router } from 'express';
import { uploadResume } from '../controllers/file.controller.js';
import { requireAuth } from '../middleware/auth.js';
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../src/public/resume");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const safeBaseName = path
            .basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .slice(0, 80);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${safeBaseName}${extension}`);
    }
});

const allowedMimeTypes = new Set([
    "application/pdf"
]);

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error("Unsupported file type"));
        }
        cb(null, true);
    }
});
router.post('/uploadFile', requireAuth, upload.single("file"), uploadResume);

export default router;
