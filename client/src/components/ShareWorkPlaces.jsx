import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { UserMultiple4, ArrowBothDirectionHorizontal2 } from '@tailgrids/icons';
import { apiRequest } from '../api/http.js';
import AvatarImage from './AvatarImage.jsx';

export default function ShareWorkPlaces({ workspace, onClose }) {
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest(
          `/workplaces/${workspace.id}/share-users?search=${encodeURIComponent(search.trim())}`,
          { token },
        );
        if (!cancelled) setUsers(Array.isArray(result.users) ? result.users : []);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || 'Unable to load users.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, token, workspace.id]);

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && !savingId && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, savingId]);

  const toggleInvite = async (user) => {
    if (savingId) return;
    setSavingId(Number(user.id));
    try {
      if (user.isInvited) {
        const result = await apiRequest(`/workplaces/${workspace.id}/shares/${user.id}`, {
          method: 'DELETE',
          token,
        });
        setUsers((current) => current.map((item) => (
          Number(item.id) === Number(user.id) ? { ...item, isInvited: false } : item
        )));
        toast.success(result.message || 'Workspace access removed');
      } else {
        const result = await apiRequest(`/workplaces/${workspace.id}/shares`, {
          method: 'POST',
          token,
          body: { userId: user.id },
        });
        setUsers((current) => current.map((item) => (
          Number(item.id) === Number(user.id) ? { ...item, isInvited: true } : item
        )));
        toast.success(result.message || 'User invited');
      }
    } catch (requestError) {
      toast.error(requestError.message || 'Unable to update workspace access');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div
      className="share-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={() => !savingId && onClose()}
    >
      <motion.section
        className="share-workspace-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-workspace-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="share-modal-header">
          <div className="share-modal-heading">
            <span className="share-modal-icon"><UserMultiple4 /></span>
            <div>
              <span className="eyebrow">Workspace access</span>
              <h2 id="share-workspace-title">Share “{workspace.title}”</h2>
              <p>Invited users can open this board and edit todos and tickets.</p>
            </div>
          </div>
          <button type="button" className="icon-button" aria-label="Close share modal" onClick={onClose}>×</button>
        </div>

        <div className="share-search-wrap">
          <ArrowBothDirectionHorizontal2 aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name or email"
            aria-label="Search users"
            autoFocus
          />
        </div>

        <div className="share-table-wrap">
          <table className="share-users-table">
            <thead>
              <tr>
                <th>No</th>
                <th>User Name</th>
                <th>Status</th>
                <th>Feature</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="4"><div className="share-state"><span className="button-loader" /> Loading users…</div></td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan="4"><div className="share-state error">{error}</div></td></tr>
              )}
              {!loading && !error && !users.length && (
                <tr><td colSpan="4"><div className="share-state">No matching users found.</div></td></tr>
              )}
              {!loading && !error && users.map((user, index) => {
                const saving = Number(savingId) === Number(user.id);
                return (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="share-user-cell">
                        <AvatarImage user={user} size={36} />
                        <div>
                          <strong>{user.email}</strong>
                          <span>{user.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`share-status ${user.isActive ? 'active' : 'inactive'}`}>
                        <i /> {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <motion.button
                        type="button"
                        className={`share-invite-button ${user.isInvited ? 'invited' : ''}`}
                        disabled={!user.isActive || saving}
                        whileHover={user.isActive && !saving ? { y: -1, scale: 1.02 } : undefined}
                        whileTap={user.isActive && !saving ? { scale: 0.97 } : undefined}
                        onClick={() => toggleInvite(user)}
                      >
                        {saving ? 'Saving…' : user.isInvited ? 'Remove access' : 'Invite'}
                      </motion.button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </motion.div>
  );
}
