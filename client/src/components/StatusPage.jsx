import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const icons = {
  notFound: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m20 20-4.2-4.2m1.7-5.3a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      <path d="M8.7 8.8h.01M12.3 8.8h.01M8.8 12.4c.8-.7 1.8-1 2.8-1s2 .3 2.8 1" />
    </svg>
  ),
  denied: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10M12 14v2.5" />
    </svg>
  )
};

export default function StatusPage({
  code,
  eyebrow,
  title,
  description,
  icon = 'notFound',
  primaryLabel = 'Go home',
  primaryTo = '/',
  secondaryLabel = 'Go back'
}) {
  const navigate = useNavigate();

  return (
    <main className={`status-page status-page-${icon}`}>
      <div className="status-orb status-orb-one" />
      <div className="status-orb status-orb-two" />

      <Link className="status-brand" to="/" aria-label="Flowboard home">
        <span className="status-brand-mark" aria-hidden="true">
          <i />
          <i />
        </span>
        <span>Flowboard</span>
      </Link>

      <motion.section
        className="status-card"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby="status-page-title"
      >
        <div className="status-visual" aria-hidden="true">
          <span className="status-code">{code}</span>
          <span className="status-icon">{icons[icon]}</span>
        </div>

        <div className="status-copy">
          <span className="status-eyebrow">{eyebrow}</span>
          <h1 id="status-page-title">{title}</h1>
          <p>{description}</p>
        </div>

        <div className="status-actions">
          <Link className="button button-primary status-primary" to={primaryTo}>
            {primaryLabel}
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h12m-4-4 4 4-4 4" />
            </svg>
          </Link>
          <button className="button status-secondary" type="button" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M16 10H4m4-4-4 4 4 4" />
            </svg>
            {secondaryLabel}
          </button>
        </div>
      </motion.section>

      <p className="status-help">Need help? Contact your workspace administrator.</p>
    </main>
  );
}
