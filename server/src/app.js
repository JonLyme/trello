import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";
import avatarRoutes from "./routes/avatar.routes.js";
import boardRoutes from "./routes/board.routes.js";
import fileRoutes from "./routes/file.routes.js";
import userRoutes from "./routes/user.routes.js";
import workplaceRoutes from "./routes/workplace.routes.js";
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", database: "connected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/users", userRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/workplaces", workplaceRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
