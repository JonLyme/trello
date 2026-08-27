import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  persistTicketOrder,
  setTodos,
} from "../../features/todos/todosSlice.js";
import TodoColumn from "./TodoColumn.jsx";
const clone = (todos) =>
  todos.map((todo) => ({
    ...todo,
    tickets: todo.tickets.map((t) => ({ ...t })),
  }));
function locate(todos, id) {
  for (let i = 0; i < todos.length; i++) {
    const j = todos[i].tickets.findIndex((t) => Number(t.id) === Number(id));
    if (j !== -1) return { todoIndex: i, ticketIndex: j };
  }
  return null;
}
function move(todos, ticketId, destinationTodoId, overTicketId = null) {
  const next = clone(todos);
  if (overTicketId !== null && Number(overTicketId) === Number(ticketId))
    return next;
  const source = locate(next, ticketId),
    di = next.findIndex((t) => Number(t.id) === Number(destinationTodoId));
  if (!source || di === -1) return next;
  const [moving] = next[source.todoIndex].tickets.splice(source.ticketIndex, 1);
  moving.todoId = Number(destinationTodoId);
  const list = next[di].tickets;
  let index = list.length;
  if (overTicketId !== null) {
    const found = list.findIndex((t) => Number(t.id) === Number(overTicketId));
    if (found !== -1) index = found;
  }
  list.splice(index, 0, moving);
  next.forEach((todo) => {
    todo.tickets = todo.tickets.map((t, i) => ({
      ...t,
      todoId: Number(todo.id),
      position: i,
    }));
  });
  return next;
}
export default function TodoBoard({ workspaceId }) {
  const dispatch = useDispatch(),
    todos = useSelector((s) => s.todos.items),
    [activeTicket, setActiveTicket] = useState(null),
    ref = useRef(todos),
    snapshot = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
  );
  useEffect(() => {
    ref.current = todos;
  }, [todos]);
  const destination = (over) => {
    if (!over) return null;
    const d = over.data.current;
    if (d?.type === "todo")
      return { todoId: Number(d.todoId), overTicketId: null };
    if (d?.type === "ticket")
      return { todoId: Number(d.todoId), overTicketId: Number(d.ticketId) };
    return null;
  };
  const start = ({ active }) => {
    const id = Number(active.data.current?.ticketId);
    const found = locate(ref.current, id);
    if (!found) return;
    snapshot.current = clone(ref.current);
    setActiveTicket(ref.current[found.todoIndex].tickets[found.ticketIndex]);
  };
  const over = ({ active, over }) => {
    const dest = destination(over),
      id = Number(active.data.current?.ticketId);
    if (!dest || !id) return;
    const source = locate(ref.current, id);
    if (!source || Number(ref.current[source.todoIndex].id) === dest.todoId)
      return;
    const next = move(ref.current, id, dest.todoId, dest.overTicketId);
    ref.current = next;
    dispatch(setTodos(next));
  };
  const end = async ({ active, over }) => {
    setActiveTicket(null);
    const dest = destination(over),
      id = Number(active.data.current?.ticketId);
    if (!dest || !id) {
      if (snapshot.current) dispatch(setTodos(snapshot.current));
      snapshot.current = null;
      return;
    }
    const next = move(ref.current, id, dest.todoId, dest.overTicketId);
    ref.current = next;
    dispatch(setTodos(next));
    const columns = next.map((todo) => ({
      todoId: Number(todo.id),
      ticketIds: todo.tickets.map((t) => Number(t.id)),
    }));
    const r = await dispatch(persistTicketOrder({ workspaceId, columns }));
    if (persistTicketOrder.rejected.match(r)) {
      dispatch(setTodos(snapshot.current || next));
      toast.error(r.payload || "Unable to save ticket order");
    } else toast.success("Ticket order saved", { duration: 1600 });
    snapshot.current = null;
  };
  const cancel = () => {
    setActiveTicket(null);
    if (snapshot.current) {
      ref.current = snapshot.current;
      dispatch(setTodos(snapshot.current));
    }
    snapshot.current = null;
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={start}
      onDragOver={over}
      onDragEnd={end}
      onDragCancel={cancel}
    >
      <div className='todo-board'>
        {todos.map((todo) => (
          <TodoColumn key={todo.id} todo={todo} />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <div className='ticket-overlay'>
            <strong>{activeTicket.title}</strong>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
