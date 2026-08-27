import { Router } from "express";
import {
  createTicket,
  createTodo,
  deleteTicket,
  deleteTodo,
  getBoard,
  reorderTickets,
  updateTicket,
  updateTodo,
} from "../controllers/board.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/:workspaceId", getBoard);
router.post("/:workspaceId/todos", createTodo);
router.patch("/todos/:todoId", updateTodo);
router.delete("/todos/:todoId", deleteTodo);
router.post("/todos/:todoId/tickets", createTicket);
router.patch("/tickets/:ticketId", updateTicket);
router.delete("/tickets/:ticketId", deleteTicket);
router.patch("/:workspaceId/tickets/reorder", reorderTickets);

export default router;
