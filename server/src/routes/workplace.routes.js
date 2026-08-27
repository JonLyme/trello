import crypto from "crypto";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  deleteWorkplace,
  getWorkplace,
  insertWorkplace,
  inviteToWorkspace,
  listShareCandidates,
  listSharedWorkspaces,
  listWorkSpaces,
  revokeWorkspaceShare,
  updateWorkplace,
  listInvitedWorkspaces,
} from "../controllers/workplace.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const uploadDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/symbol",
);
fs.mkdirSync(uploadDir, { recursive: true });

const ext = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${ext[file.mimetype] || ""}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ext[file.mimetype]
      ? cb(null, true)
      : cb(new Error("Use a JPEG, PNG, or WebP image.")),
});

router.use(requireAuth);
router.get("/", listWorkSpaces);
router.get("/shared", listSharedWorkspaces);
router.post("/invitedUser", listInvitedWorkspaces);
router.post("/add", upload.single("file"), insertWorkplace);
router.get("/:id/share-users", listShareCandidates);
router.post("/:id/shares", inviteToWorkspace);
router.delete("/:id/shares/:userId", revokeWorkspaceShare);
router.get("/:id", getWorkplace);
router.patch("/:id", updateWorkplace);
router.delete("/:id", deleteWorkplace);

export default router;
