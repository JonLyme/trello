import { useEffect, useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  createTicket,
  deleteTicket,
  deleteTodo,
  updateTodo,
} from "../../features/todos/todosSlice.js";
import SortableTicket from "./SortableTicket.jsx";
import { Gear1, Pencil1, Plus, Trash1 } from "@tailgrids/icons";
import { current } from "@reduxjs/toolkit";

function DeleteTodoModal({ todo, busy, onClose, onConfirm }) {
  return (
    <motion.div
      className='modal-backdrop'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={() => !busy && onClose()}
    >
      <motion.div
        className='modern-modal glass'
        role='dialog'
        aria-modal='true'
        aria-labelledby={`delete-todo-${todo.id}`}
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className='danger-modal-icon'>!</div>
        <span className='eyebrow danger-text'>Delete todo</span>
        <h2 id={`delete-todo-${todo.id}`}>Delete “{todo.title}”?</h2>
        <p>
          All tickets inside this todo column will also be permanently deleted.
        </p>
        <div className='modal-actions'>
          <button
            className='button button-ghost'
            type='button'
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className='button button-danger'
            type='button'
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Deleting…" : "Delete todo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TodoColumn({ todo }) {
  const dispatch = useDispatch();
  const savingTodo = useSelector((state) =>
    state.todos.savingTodoIds.includes(Number(todo.id)),
  );
  const savingTicketIds = useSelector((state) => state.todos.savingTicketIds);
  const menuRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "" });
  const [todoForm, setTodoForm] = useState({
    title: todo.title,
    description: todo.description || "",
  });
  const { setNodeRef, isOver } = useDroppable({
    id: `todo-${todo.id}`,
    data: { type: "todo", todoId: Number(todo.id) },
  });

  useEffect(
    () =>
      setTodoForm({ title: todo.title, description: todo.description || "" }),
    [todo.title, todo.description],
  );

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setSettings(false);
    };
    const closeOnEscape = (event) =>
      event.key === "Escape" && setSettings(false);
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const add = async (event) => {
    event.preventDefault();
    const values = {
      title: ticketForm.title.trim(),
      description: ticketForm.description.trim(),
    };
    if (values.title.length < 2)
      return toast.error("Ticket title needs at least 2 characters.");
    const result = await dispatch(createTicket({ todoId: todo.id, values }));
    if (createTicket.fulfilled.match(result)) {
      toast.success("Ticket added");
      setTicketForm({ title: "", description: "" });
      setAdding(false);
    } else toast.error(result.payload || "Unable to add ticket");
  };

  const save = async (event) => {
    event.preventDefault();
    if (todoForm.title.trim().length < 2)
      return toast.error("Todo title needs at least 2 characters.");
    const result = await dispatch(
      updateTodo({
        todoId: todo.id,
        values: {
          title: todoForm.title.trim(),
          description: todoForm.description.trim(),
        },
      }),
    );
    if (updateTodo.fulfilled.match(result)) {
      toast.success("Todo updated");
      setEditing(false);
    } else toast.error(result.payload || "Unable to update todo");
  };

  const removeTodo = async () => {
    const result = await dispatch(deleteTodo(todo.id));
    if (deleteTodo.fulfilled.match(result)) {
      toast.success("Todo deleted");
      setConfirmingDelete(false);
    } else toast.error(result.payload || "Unable to delete todo");
  };

  const removeTicket = async (ticket) => {
    const result = await dispatch(
      deleteTicket({ todoId: todo.id, ticketId: ticket.id }),
    );
    if (deleteTicket.fulfilled.match(result)) toast.success("Ticket deleted");
    else toast.error(result.payload || "Unable to delete ticket");
  };

  return (
    <section
      ref={setNodeRef}
      className={`todo-column glass ${isOver ? "over" : ""}`}
    >
      <header className='todo-column-header relative' ref={menuRef}>
        <div>
          <h2>{todo.title}</h2>
          {todo.description && <p>{todo.description}</p>}
        </div>
        <div className='flex'>
          <button
            className='m-2 hover:cursor-pointer'
            onClick={() => setSettings((current) => !current)}
          >
            <Gear1 />
          </button>
        </div>
        <AnimatePresence>
          {settings && (
            <motion.div
              className='user-dropdown -mt-10'
              role='menu'
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <p className='text-right pr-3'>
                tickets count:
                {todo.tickets.length}
              </p>
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setAdding((value) => !value);
                  setSettings(false);
                }}
              >
                <Plus />
                <span>add ticket</span>
              </button>
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  setEditing((value) => !value);
                  setSettings(false);
                }}
              >
                <Pencil1 />
                <span>edit</span>
              </button>
              <div className='user-dropdown-separator' />
              <button
                type='button'
                role='menuitem'
                className='danger'
                onClick={() => {
                  setConfirmingDelete(true);
                  setSettings(false);
                }}
              >
                <Trash1 />
                <span>delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <div className='user-dropdown-separator' />
      {editing && (
        <form className='column-inline-form' onSubmit={save}>
          <input
            required
            minLength='2'
            maxLength='100'
            value={todoForm.title}
            onChange={(event) =>
              setTodoForm({ ...todoForm, title: event.target.value })
            }
          />
          <textarea
            rows='2'
            maxLength='500'
            value={todoForm.description}
            onChange={(event) =>
              setTodoForm({ ...todoForm, description: event.target.value })
            }
          />
          <div>
            <button type='button' onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button disabled={savingTodo}>
              {savingTodo ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
      {adding && (
        <form className='column-inline-form ticket-form' onSubmit={add}>
          <input
            autoFocus
            required
            minLength='2'
            maxLength='140'
            placeholder='Ticket title'
            value={ticketForm.title}
            onChange={(event) =>
              setTicketForm({ ...ticketForm, title: event.target.value })
            }
          />
          <textarea
            rows='2'
            maxLength='1000'
            placeholder='Optional details'
            value={ticketForm.description}
            onChange={(event) =>
              setTicketForm({ ...ticketForm, description: event.target.value })
            }
          />
          <div>
            <button type='button' onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button disabled={savingTodo}>
              {savingTodo ? "Adding…" : "Add ticket"}
            </button>
          </div>
        </form>
      )}
      <SortableContext
        items={todo.tickets.map((ticket) => `ticket-${ticket.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className='ticket-list'>
          {todo.tickets.map((ticket, index) => (
            <SortableTicket
              key={ticket.id}
              ticket={ticket}
              todoId={todo.id}
              position={index}
              deleting={savingTicketIds.includes(Number(ticket.id))}
              onDelete={removeTicket}
            />
          ))}
          {!todo.tickets.length && (
            <div className='ticket-empty'>
              Drop a ticket here or add a new one.
            </div>
          )}
        </div>
      </SortableContext>
      <AnimatePresence>
        {confirmingDelete && (
          <DeleteTodoModal
            todo={todo}
            busy={savingTodo}
            onClose={() => setConfirmingDelete(false)}
            onConfirm={removeTodo}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
