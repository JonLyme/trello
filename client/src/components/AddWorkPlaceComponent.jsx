import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { insertWorkplace } from "../features/workplaces/workplacesSlice.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EMPTY_FORM = { title: "", description: "", file: null };

export default function AddWorkPlaceComponent() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState("");
  const titleRef = useRef(null);

  const close = () => {
    if (saving) return;
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  useEffect(() => {
    if (!form.file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(form.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  useEffect(() => {
    if (!open) return undefined;
    titleRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, saving]);

  const chooseFile = (file) => {
    if (!file) return setForm((current) => ({ ...current, file: null }));
    if (!ALLOWED_TYPES.has(file.type))
      return toast.error("Use a JPEG, PNG, or WebP image.");
    if (file.size > MAX_FILE_SIZE)
      return toast.error("Image must be 5 MB or smaller.");
    setForm((current) => ({ ...current, file }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 2 || description.length < 2 || !form.file)
      return toast.error("Complete all fields.");
    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("file", form.file);
    setSaving(true);
    const result = await dispatch(insertWorkplace(data));
    setSaving(false);
    if (insertWorkplace.fulfilled.match(result)) {
      toast.success("Workspace created");
      setForm(EMPTY_FORM);
      setOpen(false);
    } else toast.error(result.payload || "Unable to create workspace");
  };

  return (
    <>
      <motion.button
        className='button button-primary'
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        + New workspace
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className='modal-backdrop'
            onMouseDown={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              className='modern-modal glass'
              role='dialog'
              aria-modal='true'
              aria-labelledby='add-workspace-title'
              onSubmit={submit}
              onMouseDown={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
            >
              <div className='modal-icon'>✦</div>
              <div className='section-heading'>
                <div>
                  <span className='eyebrow'>Create new</span>
                  <h2 id='add-workspace-title'>Add a workspace</h2>
                </div>
                <button
                  type='button'
                  className='icon-button'
                  aria-label='Close modal'
                  disabled={saving}
                  onClick={close}
                >
                  ×
                </button>
              </div>
              <label>
                Workspace title
                <input
                  ref={titleRef}
                  value={form.title}
                  minLength='2'
                  maxLength='100'
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder='Marketing launch'
                  required
                />
                <small className='field-help'>{form.title.length}/100</small>
              </label>
              <label>
                Description
                <textarea
                  rows='4'
                  value={form.description}
                  minLength='2'
                  maxLength='191'
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder='What is this workspace for?'
                  required
                />
                <small className='field-help'>
                  {form.description.length}/191
                </small>
              </label>
              <label className='file-picker'>
                Cover image
                <input
                  type='file'
                  accept='image/jpeg,image/png,image/webp'
                  required
                  onChange={(e) => chooseFile(e.target.files?.[0] || null)}
                />
                <span>
                  {form.file?.name ||
                    "Choose a JPEG, PNG, or WebP image (max 5 MB)"}
                </span>
              </label>
              {preview && (
                <img
                  className='workspace-upload-preview'
                  src={preview}
                  alt='Selected workspace cover preview'
                />
              )}
              <div className='modal-actions'>
                <button
                  type='button'
                  className='button button-ghost'
                  disabled={saving}
                  onClick={close}
                >
                  Cancel
                </button>
                <button className='button button-primary' disabled={saving}>
                  {saving ? "Creating…" : "Create workspace"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
