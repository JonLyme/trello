import { useEffect, useState } from "react";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export default function AvatarImage({ user, className = "", alt, size }) {
  const [failed, setFailed] = useState(false);
  const style = size ? { width: size, height: size } : undefined;
  useEffect(() => setFailed(false), [user?.avatarUrl]);

  if (user?.avatarUrl && !failed) {
    return (
      <img
        className={`avatar avatar-image ${className}`.trim()}
        src={`${API_ORIGIN}${user.avatarUrl}`}
        alt={alt || `${user.name}'s avatar`}
        style={style}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={`avatar ${className}`.trim()}
      style={style}
      aria-label={alt || `${user?.name || "User"} avatar`}
    >
      {user?.name?.slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}
