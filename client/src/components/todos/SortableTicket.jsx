import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { updateTicket } from "../../features/todos/todosSlice.js";
import { Pencil1, Trash1, UserMultiple4 } from "@tailgrids/icons";
import { AnimatePresence, motion } from "framer-motion";
import CommentModal from "./CommentModal.jsx";

export default function SortableTicket({
  ticket,
  todoId,
  position,
  deleting,
  onDelete,
}) {
  const dispatch = useDispatch();
  const [confirmingComment, setConfirmingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: ticket.title,
    description: ticket.description || "",
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `ticket-${ticket.id}`,
    data: {
      type: "ticket",
      ticketId: Number(ticket.id),
      todoId: Number(todoId),
      position: Number(position),
    },
    disabled: editing,
  });

  useEffect(() => {
    setForm({ title: ticket.title, description: ticket.description || "" });
  }, [ticket.title, ticket.description]);

  const save = async (event) => {
    event.preventDefault();
    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
    };
    if (values.title.length < 2)
      return toast.error("Ticket title needs at least 2 characters.");
    const result = await dispatch(
      updateTicket({ ticketId: ticket.id, values }),
    );
    if (updateTicket.fulfilled.match(result)) {
      toast.success("Ticket updated");
      setEditing(false);
    } else toast.error(result.payload || "Unable to update ticket");
  };

  return (
    <>
      <article
        ref={setNodeRef}
        className={`min-h-30 items-center ticket-card ${isDragging ? "dragging" : ""} ${editing ? "editing" : ""}`}
        style={{ transform: CSS.Transform.toString(transform), transition }}
      >
        {editing ? (
          <form className='ticket-edit-form' onSubmit={save}>
            <input
              autoFocus
              required
              minLength='2'
              maxLength='140'
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
            />
            <textarea
              rows='2'
              maxLength='1000'
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <div>
              <button
                type='button'
                onClick={() => setEditing(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button type='submit' disabled={deleting}>
                {deleting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className='w-full flex justify-between'>
              <div className='ticket-copy'>
                <h3>{ticket.title}</h3>
                {ticket.description && <p>{ticket.description}</p>}
              </div>
              <div className='ticket-controls'>
                <button
                  className='ticket-comment'
                  type='button'
                  aria-label={`Edit ${ticket.title}`}
                  disabled={deleting}
                  onClick={() => setConfirmingComment(true)}
                  title='Comment ticket'
                >
                  <UserMultiple4 />
                </button>
                <button
                  className='ticket-edit'
                  type='button'
                  aria-label={`Edit ${ticket.title}`}
                  disabled={deleting}
                  onClick={() => setEditing(true)}
                  title='Edit ticket'
                >
                  <Pencil1 />
                </button>
                <button
                  className='ticket-del'
                  type='button'
                  aria-label={`Delete ${ticket.title}`}
                  disabled={deleting}
                  onClick={() => onDelete(ticket)}
                  title='Delete ticket'
                >
                  <Trash1 />
                </button>
              </div>
            </div>
            <button
              className='ticket-handle'
              type='button'
              style={{ height: "100%" }}
              aria-label={`Drag ${ticket.title}`}
              {...attributes}
              {...listeners}
            >
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </button>
          </>
        )}
      </article>
      <AnimatePresence>
        {confirmingComment && (
          <CommentModal
            onClose={() => setConfirmingComment(false)}
            ticketId={ticket.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}
