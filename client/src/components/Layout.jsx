import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "../features/auth/authSlice.js";
import { resetUsers } from "../features/users/usersSlice.js";
import { resetWorkplaces } from "../features/workplaces/workplacesSlice.js";
import { resetTodos } from "../features/todos/todosSlice.js";
import { useTheme } from "../context/ThemeContext.jsx";
import AvatarImage from "./AvatarImage.jsx";
import Footer from "./Footer.jsx";
import {
  Sun1,
  MoonHalfLeft5,
  ArrowLeftSquare,
  UserMultiple1,
  BarChart2,
  UserPencil,
} from "@tailgrids/icons";

const navItems = [
  { to: "/overview", label: "Overview", icon: BarChart2 },
  { to: "/users", label: "Users", icon: UserMultiple1, adminOnly: true },
  { to: "/workspaces", label: "Workspaces", icon: UserPencil },
];

function HeaderModal({ children, titleId, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className='header-modal-backdrop'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className='header-modal modern-modal glass'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { theme, mode, setMode } = useTheme();
  const isActive = user?.isActive !== false;
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuOpen(false);
    };
    const closeOnEscape = (event) =>
      event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetUsers());
    dispatch(resetWorkplaces());
    dispatch(resetTodos());
    navigate("/signin", { replace: true });
  };

  const openProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  const openSettings = () => {
    setMenuOpen(false);
    setSettingsOpen(true);
  };

  return (
    <div className='app-shell-clean'>
      <motion.header
        className='clean-header'
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <NavLink className='clean-brand' to='/' aria-label='Trello-W home'>
          <span className='brand-symbol' aria-hidden='true'>
            <span />
            <span />
          </span>
          <strong>Trello-W</strong>
        </NavLink>

        <nav className='clean-nav' aria-label='Main navigation'>
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive: current }) =>
                  `clean-nav-link ${current ? "active" : ""}`
                }
              >
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>

        <div className='clean-header-actions' ref={menuRef}>
          <button
            type='button'
            className={`header-user-button ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup='menu'
            aria-expanded={menuOpen}
            title={`${user?.name || "User"} · ${isActive ? "Active" : "Inactive"}`}
          >
            <span className='header-avatar-wrap'>
              <AvatarImage user={user} />
              <i
                className={`presence-ping ${isActive ? "active" : "inactive"}`}
                aria-label={isActive ? "Active" : "Inactive"}
              />
            </span>
            <span className='header-user-copy'>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className='user-dropdown'
                role='menu'
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <div className='user-dropdown-summary'>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <button type='button' role='menuitem' onClick={openProfile}>
                  <UserPencil />
                  <span>User Profile</span>
                </button>
                <button type='button' role='menuitem' onClick={openSettings}>
                  {theme === "dark" ? <MoonHalfLeft5 /> : <Sun1 />}
                  <span>Settings</span>
                </button>
                <div className='user-dropdown-separator' />
                <button
                  type='button'
                  role='menuitem'
                  className='danger'
                  onClick={handleLogout}
                >
                  <ArrowLeftSquare />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className='page-container clean-page-container'>
        <Outlet />
      </main>
      <Footer />

      <AnimatePresence>
        {profileOpen && (
          <HeaderModal
            titleId='profile-modal-title'
            onClose={() => setProfileOpen(false)}
          >
            <div className='section-heading'>
              <div>
                <span className='eyebrow'>Account</span>
                <h2 id='profile-modal-title'>User Profile</h2>
              </div>
              <button
                type='button'
                className='icon-button'
                aria-label='Close profile'
                onClick={() => setProfileOpen(false)}
              >
                ×
              </button>
            </div>
            <div className='profile-modal-card'>
              <span className='profile-modal-avatar'>
                <AvatarImage user={user} size={64} />
              </span>
              <div>
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
                <div className='profile-meta-row'>
                  <span className='profile-role'>{user?.role}</span>
                  <span
                    className={`profile-status ${isActive ? "active" : "inactive"}`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </HeaderModal>
        )}

        {settingsOpen && (
          <HeaderModal
            titleId='settings-modal-title'
            onClose={() => setSettingsOpen(false)}
          >
            <div className='section-heading'>
              <div>
                <span className='eyebrow'>Preferences</span>
                <h2 id='settings-modal-title'>Settings</h2>
              </div>
              <button
                type='button'
                className='icon-button'
                aria-label='Close settings'
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>
            <label className='settings-field'>
              Theme
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
              >
                <option value='auto'>Auto — based on time</option>
                <option value='light'>Light</option>
                <option value='dark'>Dark</option>
              </select>
            </label>
            <div
              className='theme-preview-row'
              aria-label={`Current theme is ${theme}`}
            >
              <span
                className={`theme-preview ${theme === "light" ? "selected" : ""}`}
              >
                <Sun1 /> Light
              </span>
              <span
                className={`theme-preview ${theme === "dark" ? "selected" : ""}`}
              >
                <MoonHalfLeft5 /> Dark
              </span>
            </div>
          </HeaderModal>
        )}
      </AnimatePresence>
    </div>
  );
}
