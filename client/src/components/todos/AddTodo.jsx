import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { createTodo } from "../../features/todos/todosSlice.js";
import { fetchInviteUserData } from "../../features/workplaces/workplacesSlice.js";
import AvatarImage from "../AvatarImage.jsx";
export default function AddTodo({ workspaceId }) {
  const { sharedItems, sharedFetchStatus, sharedError, InvitedUsers } =
    useSelector((state) => state.workplaces);

  const dispatch = useDispatch(),
    saving = useSelector((s) => s.todos.createStatus === "loading");
  const [open, setOpen] = useState(false),
    [form, setForm] = useState({ title: "", description: "" });
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const k = (e) => e.key === "Escape" && !saving && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, saving]);
  const submit = async (e) => {
    e.preventDefault();
    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
    };
    if (values.title.length < 2)
      return toast.error("Todo title needs at least 2 characters.");
    const r = await dispatch(createTodo({ workspaceId, values }));
    if (createTodo.fulfilled.match(r)) {
      toast.success("Todo column created");
      setForm({ title: "", description: "" });
      setOpen(false);
    } else toast.error(r.payload || "Unable to create todo");
  };
  return (
    <>
      <motion.button
        className='button button-primary'
        type='button'
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.97 }}
      >
        + New todo
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className='modal-backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => !saving && setOpen(false)}
          >
            <motion.form
              className='modern-modal glass'
              onSubmit={submit}
              onMouseDown={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
            >
              <div className='section-heading'>
                <div>
                  <span className='eyebrow'>Create list</span>
                  <h2>Add a todo column</h2>
                </div>
                <button
                  className='icon-button'
                  type='button'
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  ×
                </button>
              </div>
              <label>
                Todo title
                <input
                  ref={ref}
                  required
                  minLength='2'
                  maxLength='100'
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder='In progress'
                />
              </label>
              <label>
                Description
                <textarea
                  rows='4'
                  maxLength='500'
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder='What belongs in this list?'
                />
              </label>
              <div className='modal-actions'>
                <button
                  className='button button-ghost'
                  type='button'
                  disabled={saving}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className='button button-primary' disabled={saving}>
                  {saving ? "Creating…" : "Create todo"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
