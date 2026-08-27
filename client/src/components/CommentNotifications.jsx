import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

export default function CommentNotifications() {
  const user = useSelector((state) => state.auth.user);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'ticket_comment') return;
      if (data.comment.user_id === user.id) return;
      toast(`${data.comment.name || 'User'} adds 1 comments`);
    };
    return () => socket.close();
  }, [user]);

  return null;
}
