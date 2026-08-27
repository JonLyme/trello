import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection, pool } from "./config/db.js";
import { WebSocketServer } from "ws";

const port = Number(process.env.PORT || 5000);
const wsPort = Number(8080);

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  try {
    await checkDatabaseConnection();
  } catch (dbError) {
    console.error(
      "Database is unavailable. Start MySQL and verify server/.env settings.",
    );
    throw dbError;
  }
  const server = app.listen(port, () =>
    console.log(`API listening on http://localhost:${port}`),
  );
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  // realtime ticket comment websocket
  const wss = new WebSocketServer({ port: 8080 });

  wss.on("connection", (socket) => {
    console.log("Comment client connected");

    socket.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "get_ticket_comments") {
          const [rows] = await pool.query(
            `SELECT c.id, c.ticket_id, c.user_id, c.message, c.created_at, u.name, u.avatar_url
             FROM comments c JOIN users u ON u.id=c.user_id
             WHERE c.ticket_id=? ORDER BY c.created_at ASC`,
            [data.ticket_id],
          );
          socket.send(
            JSON.stringify({ type: "ticket_comments_history", comments: rows }),
          );
          return;
        }
        if (data.type === "ticket_comment") {
          const [result] = await pool.query(
            "INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)",
            [data.ticket_id, data.user_id, data.message],
          );
          const [rows] = await pool.query(
            `SELECT c.id, c.ticket_id, c.user_id, c.message, c.created_at, u.name, u.avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?`,
            [result.insertId],
          );
          const outgoing = { type: "ticket_comment", comment: rows[0] };
          wss.clients.forEach((client) => {
            if (client.readyState === 1) client.send(JSON.stringify(outgoing));
          });
        }
      } catch (error) {
        console.error("Invalid websocket message:", error);
      }
    });

    socket.on("close", () => {
      console.log("Client disconnected");
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  console.log("Server running on ws://localhost:8080");
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  console.error("Unable to start the API:", error.message);
  process.exit(1);
}
