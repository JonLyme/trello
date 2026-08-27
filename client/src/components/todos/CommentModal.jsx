import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import AvatarInviteUsers from "../AvatarInviteUsers.jsx";
import {
  DoubleCheckMark,
  Message2Reversed,
  Plus,
  FileFormatPdf,
  FileImage,
  FileText,
  Xmark2x,
} from "@tailgrids/icons";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EMPTY_FORM = { file: null };

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

export default function CommentModal({ onClose, ticketId }) {
  const socketRef = useRef(null);
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectFileType, setSelectFileType] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const user = useSelector((state) => state.auth.user);

  const scrollBottom = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      const element = boxRef.current;
      if (element) {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      }
      frameRef.current = null;
    });
  };

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnectionError("");
      socket.send(
        JSON.stringify({
          type: "get_ticket_comments",
          ticket_id: Number(ticketId),
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "ticket_comments_history") {
          setMessages(Array.isArray(data.comments) ? data.comments : []);
          return;
        }

        if (
          data.type === "ticket_comment" &&
          data.comment &&
          Number(data.comment.ticket_id) === Number(ticketId)
        ) {
          setMessages((currentMessages) => [...currentMessages, data.comment]);
        }
      } catch (error) {
        console.error("Unable to read comment message:", error);
      }
    };

    socket.onerror = () => {
      setConnectionError("Unable to connect to the comment server.");
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socketRef.current = null;
      socket.close();
    };
  }, [ticketId]);

  useEffect(() => {
    scrollBottom();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [messages]);

  useEffect(() => {
    if (!form.file) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(form.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  function formatTime(value) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatDay(value) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    }).format(date);
  }

  const send = () => {
    const cleanMessage = message.trim();

    if (
      !cleanMessage ||
      !user?.id ||
      socketRef.current?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "ticket_comment",
        user_id: Number(user.id),
        ticket_id: Number(ticketId),
        message: cleanMessage,
      }),
    );

    setMessage("");
  };

  const chooseFile = (file) => {
    if (!file) return setForm(() => ({ file: null }));
    if (!ALLOWED_TYPES.has(file.type))
      return toast.error("Use a JPEG, PNG, or WebP image.");
    if (file.size > MAX_FILE_SIZE)
      return toast.error("Image must be 5 MB or smaller.");
    setForm(() => ({ file }));
  };

  const closeFile = () => {
    setForm(() => ({ file: null }));
    setPreview("");
  };
  return (
    <motion.div
      className='modal-backdrop'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={() => onClose()}
    >
      <motion.div
        onMouseDown={(event) => event.stopPropagation()}
        className='flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl glass'
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <header className='border-b border-gray-200 p-5 text-xl font-semibold'>
          <Message2Reversed />
        </header>
        <div
          ref={boxRef}
          className='flex-1 space-y-4 overflow-y-auto p-5'
          style={{ scrollbarWidth: "thin" }}
          onMouseDown={() => setSelectFileType()}
        >
          {connectionError && (
            <div className='rounded-xl bg-red-50 p-3 text-sm text-red-600'>
              {connectionError}
            </div>
          )}

          {messages.length === 0 && !connectionError && (
            <div className='py-20 text-center text-gray-400'>
              No comments yet
            </div>
          )}

          {messages.map((comment, index) => {
            const isMine = Number(comment.user_id) === Number(user?.id);
            const commentUser = {
              ...comment,
              avatarUrl: comment.avatarUrl || comment.avatar_url || "",
            };
            const previous = messages[index - 1];

            const showDivider =
              !previous ||
              new Date(previous.created_at).toDateString() !==
                new Date(comment.created_at).toDateString();
            return (
              <div key={comment.id}>
                {showDivider && (
                  <div className='day-divider'>
                    <span>{formatDay(comment.created_at)}</span>
                  </div>
                )}
                <div
                  className={isMine ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      isMine
                        ? "max-w-[80%] p-3 flex flex-direction-reverse"
                        : "max-w-[80%] p-3 flex"
                    }
                  >
                    <div
                      className={
                        isMine
                          ? "mb-1 flex items-start gap-2 text-xs text-gray-500 ml-2"
                          : "mb-1 flex items-start gap-2 text-xs text-gray-500 mr-2"
                      }
                    >
                      <AvatarInviteUsers user={commentUser} />
                    </div>
                    <div className='overflow-hidden'>
                      <p
                        className={
                          isMine
                            ? "break-words self-comment"
                            : "break-words other-comment"
                        }
                      >
                        {comment.message}
                        <p className={isMine ? "place-items-end" : ""}>
                          <DoubleCheckMark size={20} />
                        </p>
                      </p>
                      <div className='mt-1'>
                        <p
                          style={{ fontSize: "10px" }}
                          className={isMine ? "text-right" : "text-left"}
                        >
                          {isMine ? "You" : comment.name || "User"}
                          <span className='ml-1'>
                            {" "}
                            {formatTime(comment.created_at)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {selectFileType && (
            <motion.div
              className='file-type-modal-backdrop '
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className='w-full text-gray-400 justify-between border border-gray-200 rounded-lg bg-white file-type-modal-pos glass'>
                <div className='p-0 text-right'>
                  <button
                    className='hover:cursor-pointer hover:bg-gray-100 hover:text-red rounded-full'
                    onClick={() => setSelectFileType(false)}
                  >
                    <Xmark2x />
                  </button>
                </div>
                <div className='flex'>
                  <div className='p-3 rounded-lg hover:bg-gray-100'>
                    <FileImage size={50} />
                  </div>
                  <div className='p-3 rounded-lg hover:bg-gray-100'>
                    <FileText size={50} />
                  </div>
                  <div className='p-3 rounded-lg hover:bg-gray-100'>
                    <FileFormatPdf size={50} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className='p-4'>
          <div className='flex gap-2 rounded-2xl bg-gray-200 p-2 glass'>
            <button
              className='text-gray-600 hover:cursor-pointer'
              onClick={() => setSelectFileType(true)}
            >
              <Plus />
            </button>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              className='h-10 flex-1 resize-none rounded-xl p-3 outline-none'
              placeholder='Write a comment...'
            />
            <button
              type='button send-btn'
              disabled={!connected || !message.trim()}
              onClick={send}
              className='rounded-lg bg-purple px-4 text-white disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Send comment'
              title='Send comment'
            >
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                stroke-width='1.8'
                stroke-linecap='round'
                stroke-linejoin='round'
                aria-hidden='true'
                style={{ width: "15px" }}
              >
                <path d='m22 2-7 20-4-9-9-4Z'></path>
                <path d='M22 2 11 13'></path>
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
