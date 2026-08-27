import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AvatarImage from './AvatarImage.jsx';

const links = [
  { to: '/', label: 'Welcome', icon: '⌂', end: true },
  { to: '/overview', label: 'Overview', icon: '◉' },
  { to: '/workspaces', label: 'Workspaces', icon: '▦' },
];

export default function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const items = user?.role === 'admin' ? [...links, { to: '/users', label: 'Users', icon: '♙' }] : links;

  return (
    <motion.aside className="sidebar glass" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <NavLink className="sidebar-brand" to="/">
        <span className="brand-symbol"><span /><span /></span>
        <span className="brand-word text-purple">Trello-W</span>
      </NavLink>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-caption">Workspace</p>
        {items.map(({ to, label, icon, end }, index) => (
          <motion.div key={to} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.06 + index * 0.05 }}>
            <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="sidebar-icon" aria-hidden="true">{icon}</span><span>{label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
      <div className="sidebar-profile">
        <AvatarImage user={user} />
        <div><strong>{user?.name}</strong><span>{user?.role}</span></div>
      </div>
    </motion.aside>
  );
}
