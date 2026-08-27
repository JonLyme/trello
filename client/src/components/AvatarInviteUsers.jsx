import { color, rgba } from "framer-motion";
import { useEffect, useState } from "react";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export default function AvatarInviteUsers({ user, className = "", alt, size }) {
  const [failed, setFailed] = useState(false);
  function avatarGradient(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1)
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    const hue = Math.abs(hash) % 360;
    const hue2 = (hue + 72) % 360;
    return `linear-gradient(135deg, hsl(${hue} 84% 60%), hsl(${hue2} 82% 54%))`;
  }
  const style = size
    ? {
        width: size,
        height: size,
        fontSize: "10px",
        background: avatarGradient(user.name),
      }
    : undefined;
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
