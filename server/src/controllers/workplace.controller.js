import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";
import { toPublicWorkplace } from "../utils/workplace.js";

const symbolDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/symbol",
);
const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const removeFile = (filePath) => filePath && fs.unlink(filePath, () => {});

async function getOwnedWorkspace(db, workspaceId, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT id, user_id, title, description, image_originalName, image_storedName, image_url, created_at, updated_at
     FROM workplaces
     WHERE id = ? AND user_id = ?
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [workspaceId, userId],
  );
  return rows[0] || null;
}

export async function insertWorkplace(req, res, next) {
  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  if (!req.file)
    return res.status(400).json({ message: "Please select an image." });
  if (title.length < 2 || title.length > 100) {
    removeFile(req.file.path);
    return res
      .status(400)
      .json({ message: "Title must contain between 2 and 100 characters." });
  }
  if (description.length < 2 || description.length > 191) {
    removeFile(req.file.path);
    return res.status(400).json({
      message: "Description must contain between 2 and 191 characters.",
    });
  }

  const connection = await pool.getConnection();
  let committed = false;
  try {
    await connection.beginTransaction();
    const imageUrl = `/symbol/${encodeURIComponent(req.file.filename)}`;
    const [result] = await connection.execute(
      `INSERT INTO workplaces
       (user_id, title, description, image_originalName, image_storedName, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description,
        req.file.originalname,
        req.file.filename,
        imageUrl,
      ],
    );
    await connection.execute(
      `INSERT INTO activity_events (user_id, event_type, entity_type, entity_id, description)
       VALUES (?, 'created', 'workspace', ?, ?)`,
      [Number(req.user.id), result.insertId, `Created workspace “${title}”`],
    );

    const [rows] = await connection.execute(
      `SELECT id, title, description, image_url, created_at, updated_at
       FROM workplaces WHERE id = ? AND user_id = ? LIMIT 1`,
      [result.insertId, req.user.id],
    );
    await connection.commit();
    committed = true;

    return res.status(201).json({
      message: "Workspace added successfully.",
      workplace: toPublicWorkplace(rows[0]),
    });
  } catch (error) {
    await connection.rollback();
    if (!committed) removeFile(req.file?.path);
    return next(error);
  } finally {
    connection.release();
  }
}

export async function listWorkSpaces(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, description, image_url, created_at, updated_at
       FROM workplaces
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id],
    );
    return res.json({ workplaces: rows.map(toPublicWorkplace) });
  } catch (error) {
    return next(error);
  }
}

export async function listSharedWorkspaces(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT w.id, w.title, w.description, w.image_url, w.created_at, w.updated_at,
              ws.created_at AS shared_at,
              owner.id AS owner_id, owner.name AS owner_name, owner.email AS owner_email,
              owner.avatar_url AS owner_avatar_url,
              COALESCE(inviter.id, owner.id) AS inviter_id,
              COALESCE(inviter.name, owner.name) AS inviter_name,
              COALESCE(inviter.email, owner.email) AS inviter_email,
              COALESCE(inviter.avatar_url, owner.avatar_url) AS inviter_avatar_url
       FROM workspace_shares ws
       INNER JOIN workplaces w ON w.id = ws.workplace_id
       INNER JOIN users owner ON owner.id = w.user_id
       LEFT JOIN users inviter ON inviter.id = ws.invited_by
       WHERE ws.user_id = ?
       ORDER BY ws.created_at DESC, w.id DESC`,
      [req.user.id],
    );

    return res.json({
      workplaces: rows.map((row) => ({
        ...toPublicWorkplace(row),
        permission: "editor",
        sharedAt: row.shared_at,
        owner: {
          id: Number(row.owner_id),
          name: row.owner_name,
          email: row.owner_email,
          avatarUrl: row.owner_avatar_url || "",
        },
        invitedBy: {
          id: Number(row.inviter_id),
          name: row.inviter_name,
          email: row.inviter_email,
          avatarUrl: row.inviter_avatar_url || "",
        },
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listInvitedWorkspaces(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT ws.user_id AS user_id, 
      (SELECT u.name FROM users AS u WHERE u.id=ws.user_id) AS name, 
      (SELECT s.avatar_url FROM users AS s WHERE s.id=ws.user_id) AS avatarUrl FROM workspace_shares AS ws WHERE ws.workplace_id=? `,
      [req.body.workspace_id],
    );

    return res.json({
      users_data: rows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listShareCandidates(req, res, next) {
  const workspaceId = parseId(req.params.id);
  if (!workspaceId)
    return res.status(400).json({ message: "Invalid workspace ID." });
  const search =
    typeof req.query?.search === "string"
      ? req.query.search.trim().slice(0, 120)
      : "";

  try {
    const workspace = await getOwnedWorkspace(pool, workspaceId, req.user.id);
    if (!workspace)
      return res.status(404).json({ message: "Workspace not found." });

    const pattern = `%${search}%`;
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.avatar_url,
              CASE WHEN ws.user_id IS NULL THEN 0 ELSE 1 END AS is_invited
       FROM users u
       LEFT JOIN workspace_shares ws
         ON ws.workplace_id = ? AND ws.user_id = u.id
       WHERE u.id <> ?
         AND (? = '' OR u.name LIKE ? OR u.email LIKE ?)
       ORDER BY is_invited DESC, u.is_active DESC, u.name ASC, u.id ASC
       LIMIT 100`,
      [workspaceId, req.user.id, search, pattern, pattern],
    );

    return res.json({
      users: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: Boolean(row.is_active),
        avatarUrl: row.avatar_url || "",
        isInvited: Boolean(row.is_invited),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function inviteToWorkspace(req, res, next) {
  const workspaceId = parseId(req.params.id);
  const userId = parseId(req.body?.userId);
  if (!workspaceId)
    return res.status(400).json({ message: "Invalid workspace ID." });
  if (!userId) return res.status(400).json({ message: "Invalid user ID." });
  if (userId === Number(req.user.id))
    return res.status(400).json({ message: "You already own this workspace." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const workspace = await getOwnedWorkspace(
      connection,
      workspaceId,
      req.user.id,
      true,
    );
    if (!workspace) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }

    const [users] = await connection.execute(
      "SELECT id, name, email, is_active FROM users WHERE id = ? LIMIT 1",
      [userId],
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found." });
    }
    if (!users[0].is_active) {
      await connection.rollback();
      return res
        .status(409)
        .json({ message: "Inactive users cannot be invited." });
    }

    await connection.execute(
      `INSERT INTO workspace_shares (workplace_id, user_id, invited_by, permission)
       VALUES (?, ?, ?, 'editor')
       ON DUPLICATE KEY UPDATE invited_by = VALUES(invited_by), permission = 'editor'`,
      [workspaceId, userId, req.user.id],
    );
    await connection.execute(
      `INSERT INTO activity_events (user_id, event_type, entity_type, entity_id, description)
       VALUES (?, 'shared', 'workspace', ?, ?)`,
      [
        req.user.id,
        workspaceId,
        `Shared workspace “${workspace.title}” with ${users[0].email}`,
      ],
    );
    await connection.commit();

    return res.json({
      message: `Workspace shared with ${users[0].email}.`,
      userId,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function revokeWorkspaceShare(req, res, next) {
  const workspaceId = parseId(req.params.id);
  const userId = parseId(req.params.userId);
  if (!workspaceId)
    return res.status(400).json({ message: "Invalid workspace ID." });
  if (!userId) return res.status(400).json({ message: "Invalid user ID." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const workspace = await getOwnedWorkspace(
      connection,
      workspaceId,
      req.user.id,
      true,
    );
    if (!workspace) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }

    const [result] = await connection.execute(
      "DELETE FROM workspace_shares WHERE workplace_id = ? AND user_id = ?",
      [workspaceId, userId],
    );
    if (!result.affectedRows) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "This user does not have access to the workspace." });
    }

    await connection.execute(
      `INSERT INTO activity_events (user_id, event_type, entity_type, entity_id, description)
       VALUES (?, 'unshared', 'workspace', ?, ?)`,
      [
        req.user.id,
        workspaceId,
        `Removed shared access from workspace “${workspace.title}”`,
      ],
    );
    await connection.commit();
    return res.json({ message: "Workspace access removed.", userId });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getWorkplace(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid workspace ID." });
  try {
    const [rows] = await pool.execute(
      `SELECT w.id, w.title, w.description, w.image_url, w.created_at, w.updated_at,
              CASE WHEN w.user_id = ? THEN 'owner' ELSE 'editor' END AS access_role
       FROM workplaces w
       LEFT JOIN workspace_shares ws ON ws.workplace_id = w.id AND ws.user_id = ?
       WHERE w.id = ? AND (w.user_id = ? OR ws.user_id IS NOT NULL)
       LIMIT 1`,
      [req.user.id, req.user.id, id, req.user.id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Workspace not found." });
    return res.json({
      workplace: {
        ...toPublicWorkplace(rows[0]),
        permission: rows[0].access_role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateWorkplace(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid workspace ID." });
  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";
  if (title.length < 2 || title.length > 100) {
    return res
      .status(400)
      .json({ message: "Title must contain between 2 and 100 characters." });
  }
  if (description.length < 2 || description.length > 191) {
    return res.status(400).json({
      message: "Description must contain between 2 and 191 characters.",
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "UPDATE workplaces SET title = ?, description = ? WHERE id = ? AND user_id = ?",
      [title, description, id, req.user.id],
    );
    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }
    await connection.execute(
      `INSERT INTO activity_events (user_id, event_type, entity_type, entity_id, description)
       VALUES (?, 'updated', 'workspace', ?, ?)`,
      [req.user.id, id, `Updated workspace “${title}”`],
    );
    const [rows] = await connection.execute(
      `SELECT id, title, description, image_url, created_at, updated_at
       FROM workplaces WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, req.user.id],
    );
    await connection.commit();
    return res.json({
      message: "Workspace updated successfully.",
      workplace: toPublicWorkplace(rows[0]),
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function deleteWorkplace(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid workspace ID." });
  const connection = await pool.getConnection();
  let storedName = "";
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT title, image_storedName FROM workplaces WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE",
      [id, req.user.id],
    );
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }
    storedName = rows[0].image_storedName || "";
    await connection.execute(
      "DELETE FROM workplaces WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );
    await connection.execute(
      `INSERT INTO activity_events (user_id, event_type, entity_type, entity_id, description)
       VALUES (?, 'deleted', 'workspace', ?, ?)`,
      [req.user.id, id, `Deleted workspace “${rows[0].title}”`],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
  if (storedName) removeFile(path.join(symbolDir, storedName));
  return res.json({ message: "Workspace deleted successfully." });
}
