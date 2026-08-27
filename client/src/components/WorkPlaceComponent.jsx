import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  deleteWorkplace,
  fetchWorkplaces,
  updateWorkplace,
} from "../features/workplaces/workplacesSlice.js";
import {
  ChevronLeft,
  ChevronRight,
  Trash1,
  Pencil1,
  ArrowBothDirectionHorizontal2,
} from "@tailgrids/icons";
import ShareWorkPlaces from "./ShareWorkPlaces.jsx";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#4f46e5"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="730" cy="80" r="140" fill="rgba(255,255,255,.14)"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="44">Workspace</text></svg>',
)}`;

function ModalShell({ children, busy, onClose, labelledBy }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

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
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function EditWorkspaceModal({ item, busy, onClose, onSave }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");

  return (
    <ModalShell busy={busy} onClose={onClose} labelledBy='edit-workspace-title'>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ title: title.trim(), description: description.trim() });
        }}
      >
        <div className='section-heading'>
          <div>
            <span className='eyebrow'>Edit workspace</span>
            <h2 id='edit-workspace-title'>Update details</h2>
          </div>
          <button
            type='button'
            className='icon-button'
            aria-label='Close'
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <label>
          Workspace title
          <input
            autoFocus
            required
            minLength='2'
            maxLength='100'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <small className='field-help'>{title.length}/100</small>
        </label>
        <label>
          Description
          <textarea
            required
            rows='4'
            minLength='2'
            maxLength='191'
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <small className='field-help'>{description.length}/191</small>
        </label>
        <div className='modal-actions'>
          <button
            type='button'
            className='button button-ghost'
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type='submit'
            className='button button-primary'
            disabled={busy}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteWorkspaceModal({ item, busy, onClose, onDelete }) {
  return (
    <ModalShell
      busy={busy}
      onClose={onClose}
      labelledBy='delete-workspace-title'
    >
      <div className='danger-modal-icon' aria-hidden='true'>
        !
      </div>
      <div className='danger-modal-copy'>
        <span className='eyebrow danger-text'>Delete workspace</span>
        <h2 id='delete-workspace-title'>Delete this workspace?</h2>
        <p>
          <strong>{item.title}</strong> and all of its todos, tickets, and
          sharing access will be permanently deleted.
        </p>
      </div>
      <div className='modal-actions'>
        <button
          type='button'
          className='button button-ghost'
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type='button'
          className='button button-danger'
          disabled={busy}
          onClick={onDelete}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </ModalShell>
  );
}

export default function WorkPlaceComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, fetchStatus, deletingIds, updatingIds, error } = useSelector(
    (state) => state.workplaces,
  );
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sharing, setSharing] = useState(null);

  useEffect(() => {
    dispatch(fetchWorkplaces());
  }, [dispatch]);

  const save = async (changes) => {
    if (!editing) return;
    if (changes.title.length < 2 || changes.description.length < 2) {
      toast.error("Title and description must contain at least 2 characters.");
      return;
    }
    const result = await dispatch(updateWorkplace({ id: editing.id, changes }));
    if (updateWorkplace.fulfilled.match(result)) {
      toast.success("Workspace updated");
      setEditing(null);
    } else toast.error(result.payload || "Unable to update workspace");
  };

  const remove = async () => {
    if (!deleting) return;
    const result = await dispatch(deleteWorkplace(deleting.id));
    if (deleteWorkplace.fulfilled.match(result)) {
      toast.success("Workspace deleted");
      setDeleting(null);
    } else toast.error(result.payload || "Unable to delete workspace");
  };

  if (fetchStatus === "loading" && !items.length) {
    return (
      <div className='workspace-grid workspace-loading'>
        {[1, 2, 3, 4].map((item) => (
          <div className='workspace-card-modern skeleton-card' key={item}>
            <div className='skeleton skeleton-cover' />
            <div className='skeleton-lines'>
              <i />
              <i />
              <i />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (fetchStatus === "failed" && !items.length) {
    return (
      <div className='empty-modern large glass' role='alert'>
        <span>!</span>
        <strong>We could not load your workspaces</strong>
        <p>{error || "Check your connection and try again."}</p>
        <button
          className='button button-primary'
          type='button'
          onClick={() => dispatch(fetchWorkplaces())}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <motion.div
        className='empty-modern large glass'
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <span>✦</span>
        <strong>Your first workspace starts here</strong>
        <p>Create one above to organize todos and tickets.</p>
      </motion.div>
    );
  }

  return (
    <>
      {fetchStatus === "failed" && (
        <div className='inline-error' role='alert'>
          Refresh failed. Showing the most recent saved results.{" "}
          <button type='button' onClick={() => dispatch(fetchWorkplaces())}>
            Retry
          </button>
        </div>
      )}

      <Swiper
        className='workspace-swiper workspace-swiper-modern'
        modules={[Navigation, Pagination, A11y]}
        navigation={{ prevEl: ".workspace-prev", nextEl: ".workspace-next" }}
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          620: { slidesPerView: 2 },
          920: { slidesPerView: 3 },
          1220: { slidesPerView: 4 },
        }}
      >
        {items.map((item) => {
          const isDeleting = deletingIds.includes(Number(item.id));
          const isUpdating = updatingIds.includes(Number(item.id));
          return (
            <SwiperSlide key={item.id}>
              <motion.article
                className='workspace-card-modern'
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className='workspace-card-cover'>
                  <img
                    src={
                      item.image_url
                        ? `${API_ORIGIN}${item.image_url}`
                        : FALLBACK_IMAGE
                    }
                    alt={`${item.title} workspace cover`}
                  />
                  <div className='workspace-hover-layer'>
                    <div className='workspace-action-row'>
                      <motion.button
                        type='button'
                        className='workspace-action-button'
                        aria-label={`Edit ${item.title}`}
                        title='Edit'
                        disabled={isDeleting || isUpdating}
                        onClick={() => setEditing(item)}
                        whileHover={{ y: -3, scale: 1.07 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <Pencil1 />
                      </motion.button>
                      <motion.button
                        type='button'
                        className='workspace-action-button danger'
                        aria-label={`Delete ${item.title}`}
                        title='Delete'
                        disabled={isDeleting || isUpdating}
                        onClick={() => setDeleting(item)}
                        whileHover={{ y: -3, scale: 1.07 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <Trash1 />
                      </motion.button>
                      <motion.button
                        type='button'
                        className='workspace-action-button'
                        aria-label={`Share ${item.title}`}
                        title='Share'
                        disabled={isDeleting || isUpdating}
                        onClick={() => setSharing(item)}
                        whileHover={{ y: -3, scale: 1.07, rotate: -4 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <ArrowBothDirectionHorizontal2 />
                      </motion.button>
                    </div>
                    <motion.button
                      type='button'
                      className='workspace-open-button'
                      onClick={() => navigate(`/workspaces/${item.id}/todos`)}
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span>{item.title}</span>
                      <ChevronRight />
                    </motion.button>
                  </div>
                </div>
                <div className='workspace-card-content'>
                  <span className='workspace-card-label'>Workspace</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.article>
            </SwiperSlide>
          );
        })}
        <button
          type='button'
          className='swiper-button-prev workspace-prev'
          aria-label='Previous workspaces'
        >
          <ChevronLeft />
        </button>
        <button
          type='button'
          className='swiper-button-next workspace-next'
          aria-label='Next workspaces'
        >
          <ChevronRight />
        </button>
      </Swiper>

      <AnimatePresence>
        {editing && (
          <EditWorkspaceModal
            item={editing}
            busy={updatingIds.includes(Number(editing.id))}
            onClose={() => setEditing(null)}
            onSave={save}
          />
        )}
        {deleting && (
          <DeleteWorkspaceModal
            item={deleting}
            busy={deletingIds.includes(Number(deleting.id))}
            onClose={() => setDeleting(null)}
            onDelete={remove}
          />
        )}
        {sharing && (
          <ShareWorkPlaces
            workspace={sharing}
            onClose={() => setSharing(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
