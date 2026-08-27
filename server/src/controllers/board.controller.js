import { pool } from "../config/db.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const cleanText = (value, max) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length <= max ? text : "";
};
const toTicket = (row) => ({
  id: Number(row.id),
  todoId: Number(row.todo_id),
  title: row.title,
  description: row.description || "",
  position: Number(row.sort_order),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const toTodo = (row) => ({
  id: Number(row.id),
  workplaceId: Number(row.workplace_id),
  title: row.title,
  description: row.description || "",
  position: Number(row.sort_order),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  tickets: [],
});

async function workspaceAccess(db, workspaceId, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT id, user_id, title, description, image_url, created_at, updated_at
     FROM workplaces
     WHERE id = ?
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [workspaceId],
  );
  const workspace = rows[0];
  if (!workspace) return null;
  if (Number(workspace.user_id) === Number(userId))
    return { workspace, role: "owner" };

  const [shares] = await db.execute(
    `SELECT permission
     FROM workspace_shares
     WHERE workplace_id = ? AND user_id = ?
     LIMIT 1`,
    [workspaceId, userId],
  );
  if (!shares.length) return null;
  return { workspace, role: shares[0].permission || "editor" };
}

async function todoAccess(db, todoId, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT id, workplace_id, title, description, sort_order, created_at, updated_at
     FROM todos
     WHERE id = ?
     LIMIT 1`,
    [todoId],
  );
  if (!rows.length) return null;
  const access = await workspaceAccess(
    db,
    Number(rows[0].workplace_id),
    userId,
    lock,
  );
  if (!access) return null;
  if (lock) {
    const [lockedRows] = await db.execute(
      `SELECT id, workplace_id, title, description, sort_order, created_at, updated_at
       FROM todos WHERE id = ? LIMIT 1 FOR UPDATE`,
      [todoId],
    );
    if (!lockedRows.length) return null;
    return { todo: lockedRows[0], access };
  }
  return { todo: rows[0], access };
}

async function ticketAccess(db, ticketId, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT tk.id, tk.todo_id, tk.title, tk.description, tk.sort_order, tk.created_at, tk.updated_at,
            t.workplace_id
     FROM tickets tk
     INNER JOIN todos t ON t.id = tk.todo_id
     WHERE tk.id = ?
     LIMIT 1`,
    [ticketId],
  );
  if (!rows.length) return null;
  const access = await workspaceAccess(
    db,
    Number(rows[0].workplace_id),
    userId,
    lock,
  );
  if (!access) return null;
  if (lock) {
    const [lockedRows] = await db.execute(
      `SELECT tk.id, tk.todo_id, tk.title, tk.description, tk.sort_order, tk.created_at, tk.updated_at,
              t.workplace_id
       FROM tickets tk
       INNER JOIN todos t ON t.id = tk.todo_id
       WHERE tk.id = ?
       LIMIT 1 FOR UPDATE`,
      [ticketId],
    );
    if (!lockedRows.length) return null;
    return { ticket: lockedRows[0], access };
  }
  return { ticket: rows[0], access };
}

export async function getBoard(req, res, next) {
  const workspaceId = parseId(req.params.workspaceId);
  if (!workspaceId)
    return res.status(400).json({ message: "Invalid workspace ID." });

  try {
    const access = await workspaceAccess(pool, workspaceId, req.user.id);
    if (!access)
      return res.status(404).json({ message: "Workspace not found." });

    const [todoRows] = await pool.execute(
      `SELECT id, workplace_id, title, description, sort_order, created_at, updated_at
       FROM todos
       WHERE workplace_id = ?
       ORDER BY sort_order, id`,
      [workspaceId],
    );
    const [ticketRows] = await pool.execute(
      `SELECT tk.id, tk.todo_id, tk.title, tk.description, tk.sort_order, tk.created_at, tk.updated_at
       FROM tickets tk
       INNER JOIN todos t ON t.id = tk.todo_id
       WHERE t.workplace_id = ?
       ORDER BY tk.todo_id, tk.sort_order, tk.id`,
      [workspaceId],
    );

    const todos = todoRows.map(toTodo);
    const map = new Map(todos.map((todo) => [todo.id, todo]));
    ticketRows.forEach((row) =>
      map.get(Number(row.todo_id))?.tickets.push(toTicket(row)),
    );

    return res.json({
      workspace: {
        id: Number(access.workspace.id),
        title: access.workspace.title,
        description: access.workspace.description,
        image_url: access.workspace.image_url,
        createdAt: access.workspace.created_at,
        updatedAt: access.workspace.updated_at,
        permission: access.role,
        canManageWorkspace: access.role === "owner",
        canEditBoard: true,
      },
      todos,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createTodo(req, res, next) {
  const workspaceId = parseId(req.params.workspaceId);
  const title = cleanText(req.body?.title, 100);
  const description = cleanText(req.body?.description, 500);
  if (!workspaceId)
    return res.status(400).json({ message: "Invalid workspace ID." });
  if (title.length < 2)
    return res
      .status(400)
      .json({
        message: "Todo title must contain between 2 and 100 characters.",
      });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await workspaceAccess(connection, workspaceId, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }
    const [positionRows] = await connection.execute(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_position FROM todos WHERE workplace_id = ?",
      [workspaceId],
    );
    const [result] = await connection.execute(
      "INSERT INTO todos (workplace_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [workspaceId, title, description, Number(positionRows[0].next_position)],
    );
    const [rows] = await connection.execute(
      "SELECT id, workplace_id, title, description, sort_order, created_at, updated_at FROM todos WHERE id = ?",
      [result.insertId],
    );
    await connection.commit();
    return res
      .status(201)
      .json({ message: "Todo created successfully.", todo: toTodo(rows[0]) });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function updateTodo(req, res, next) {
  const id = parseId(req.params.todoId);
  const title = cleanText(req.body?.title, 100);
  const description = cleanText(req.body?.description, 500);
  if (!id) return res.status(400).json({ message: "Invalid todo ID." });
  if (title.length < 2)
    return res
      .status(400)
      .json({
        message: "Todo title must contain between 2 and 100 characters.",
      });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await todoAccess(connection, id, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Todo not found." });
    }
    await connection.execute(
      "UPDATE todos SET title = ?, description = ? WHERE id = ?",
      [title, description, id],
    );
    const [rows] = await connection.execute(
      "SELECT id, workplace_id, title, description, sort_order, created_at, updated_at FROM todos WHERE id = ?",
      [id],
    );
    await connection.commit();
    return res.json({
      message: "Todo updated successfully.",
      todo: toTodo(rows[0]),
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function deleteTodo(req, res, next) {
  const id = parseId(req.params.todoId);
  if (!id) return res.status(400).json({ message: "Invalid todo ID." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await todoAccess(connection, id, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Todo not found." });
    }
    await connection.execute("DELETE FROM todos WHERE id = ?", [id]);
    await connection.commit();
    return res.json({ message: "Todo deleted successfully." });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function createTicket(req, res, next) {
  const todoId = parseId(req.params.todoId);
  const title = cleanText(req.body?.title, 140);
  const description = cleanText(req.body?.description, 1000);
  if (!todoId) return res.status(400).json({ message: "Invalid todo ID." });
  if (title.length < 2)
    return res
      .status(400)
      .json({
        message: "Ticket title must contain between 2 and 140 characters.",
      });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await todoAccess(connection, todoId, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Todo not found." });
    }
    const [positionRows] = await connection.execute(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_position FROM tickets WHERE todo_id = ?",
      [todoId],
    );
    const [result] = await connection.execute(
      "INSERT INTO tickets (todo_id, title, description, sort_order) VALUES (?, ?, ?, ?)",
      [todoId, title, description, Number(positionRows[0].next_position)],
    );
    const [rows] = await connection.execute(
      "SELECT id, todo_id, title, description, sort_order, created_at, updated_at FROM tickets WHERE id = ?",
      [result.insertId],
    );
    await connection.commit();
    return res
      .status(201)
      .json({
        message: "Ticket created successfully.",
        ticket: toTicket(rows[0]),
      });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function updateTicket(req, res, next) {
  const id = parseId(req.params.ticketId);
  const title = cleanText(req.body?.title, 140);
  const description = cleanText(req.body?.description, 1000);
  if (!id) return res.status(400).json({ message: "Invalid ticket ID." });
  if (title.length < 2)
    return res
      .status(400)
      .json({
        message: "Ticket title must contain between 2 and 140 characters.",
      });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await ticketAccess(connection, id, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Ticket not found." });
    }
    await connection.execute(
      "UPDATE tickets SET title = ?, description = ? WHERE id = ?",
      [title, description, id],
    );
    const [rows] = await connection.execute(
      "SELECT id, todo_id, title, description, sort_order, created_at, updated_at FROM tickets WHERE id = ?",
      [id],
    );
    await connection.commit();
    return res.json({
      message: "Ticket updated successfully.",
      ticket: toTicket(rows[0]),
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function deleteTicket(req, res, next) {
  const id = parseId(req.params.ticketId);
  if (!id) return res.status(400).json({ message: "Invalid ticket ID." });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const found = await ticketAccess(connection, id, req.user.id, true);
    if (!found) {
      await connection.rollback();
      return res.status(404).json({ message: "Ticket not found." });
    }
    await connection.execute("DELETE FROM tickets WHERE id = ?", [id]);
    await connection.commit();
    return res.json({ message: "Ticket deleted successfully." });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function reorderTickets(req, res, next) {
  const workspaceId = parseId(req.params.workspaceId);
  const columns = Array.isArray(req.body?.columns) ? req.body.columns : null;
  if (!workspaceId || !columns)
    return res.status(400).json({ message: "Invalid ticket order payload." });

  const normalized = [];
  const seenTodos = new Set();
  const seenTickets = new Set();
  for (const column of columns) {
    const todoId = parseId(column?.todoId);
    const ticketIds = Array.isArray(column?.ticketIds)
      ? column.ticketIds.map(parseId)
      : null;
    if (
      !todoId ||
      !ticketIds ||
      ticketIds.some((id) => !id) ||
      seenTodos.has(todoId)
    ) {
      return res.status(400).json({ message: "Invalid ticket order payload." });
    }
    seenTodos.add(todoId);
    for (const id of ticketIds) {
      if (seenTickets.has(id))
        return res
          .status(400)
          .json({ message: "A ticket appears more than once." });
      seenTickets.add(id);
    }
    normalized.push({ todoId, ticketIds });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (!(await workspaceAccess(connection, workspaceId, req.user.id, true))) {
      await connection.rollback();
      return res.status(404).json({ message: "Workspace not found." });
    }

    const [todoRows] = await connection.execute(
      "SELECT id FROM todos WHERE workplace_id = ? FOR UPDATE",
      [workspaceId],
    );
    const validTodos = new Set(todoRows.map((row) => Number(row.id)));
    if (normalized.some((item) => !validTodos.has(item.todoId))) {
      await connection.rollback();
      return res
        .status(400)
        .json({
          message: "One or more todo columns do not belong to this workspace.",
        });
    }

    const [ticketRows] = await connection.execute(
      `SELECT tk.id
       FROM tickets tk
       INNER JOIN todos t ON t.id = tk.todo_id
       WHERE t.workplace_id = ?
       FOR UPDATE`,
      [workspaceId],
    );
    const existing = ticketRows
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const submitted = [...seenTickets].sort((a, b) => a - b);
    if (
      existing.length !== submitted.length ||
      existing.some((id, index) => id !== submitted[index])
    ) {
      await connection.rollback();
      return res
        .status(409)
        .json({
          message:
            "The board changed while you were dragging. Refresh and try again.",
        });
    }

    for (const { todoId, ticketIds } of normalized) {
      for (let index = 0; index < ticketIds.length; index += 1) {
        await connection.execute(
          "UPDATE tickets SET todo_id = ?, sort_order = ? WHERE id = ?",
          [todoId, index, ticketIds[index]],
        );
      }
    }
    await connection.commit();
    return res.json({ message: "Ticket order saved." });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}
