import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function timeDetails(date) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12)
    return { greeting: "Good morning", period: "morning", isDay: true };
  if (hour >= 12 && hour < 18)
    return { greeting: "Good afternoon", period: "day", isDay: true };
  if (hour >= 18 && hour < 22)
    return { greeting: "Good evening", period: "evening", isDay: false };
  return { greeting: "Good night", period: "night", isDay: false };
}

export default function Welcome() {
  const user = useSelector((state) => state.auth.user);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const details = timeDetails(now);
  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(now),
    [now],
  );

  return (
    <motion.section
      className={`welcome-page ${details.isDay ? "welcome-day" : "welcome-night"}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* <div className="welcome-stars" aria-hidden="true"><i /><i /><i /><i /></div> */}
      <div className='welcome-copy'>
        <span className='eyebrow light'>{details.period} workspace</span>
        <h1>
          {details.greeting}, {user?.name?.split(" ")[0]}.
        </h1>
        <p>
          Choose a workspace, organize the next task, and keep every ticket
          moving.
        </p>
        <div className='welcome-clock' aria-label={`Current time ${formatted}`}>
          <strong>{formatted}</strong>
          <span>{date}</span>
        </div>
        <div className='welcome-actions'>
          <Link className='button button-light' to='/workspaces'>
            Open workspaces
          </Link>
          <Link className='button button-glass' to='/overview'>
            View overview
          </Link>
        </div>
      </div>
      <div
        className={`sky-illustration ${details.isDay ? "day-sky" : "night-sky"}`}
        aria-hidden='true'
      >
        {details.isDay ? (
          <div className='sun'>
            <span />
          </div>
        ) : (
          <div className='moon'>
            <span />
            <i />
            <b />
          </div>
        )}
        <div className='cloud cloud-one' />
        <div className='cloud cloud-two' />
      </div>
    </motion.section>
  );
}
