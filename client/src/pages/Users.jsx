import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AvatarImage from '../components/AvatarImage.jsx';
import { deleteUser, fetchUsers, updateUser } from '../features/users/usersSlice.js';
import { fetchMe } from '../features/auth/authSlice.js';

function UserCard({ user, currentUserId, saving, onSave, onDelete }) {
  const [draft, setDraft] = useState({ name: user.name, role: user.role, isActive: user.isActive });
  useEffect(() => setDraft({ name: user.name, role: user.role, isActive: user.isActive }), [user]);

  const dirty = draft.name !== user.name || draft.role !== user.role || draft.isActive !== user.isActive;
  const isSelf = Number(user.id) === Number(currentUserId);
  const joined = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(user.createdAt));

  return (
    <motion.article className="user-management-card" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="user-card-head">
        <span className="user-card-avatar-wrap">
          <AvatarImage user={user} className="user-card-avatar" />
          <i className={`user-presence-dot ${draft.isActive ? 'active' : 'inactive'}`} />
        </span>
        <div className="user-card-identity">
          <input
            className="user-name-input"
            aria-label={`Name for ${user.email}`}
            value={draft.name}
            maxLength="100"
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <span>{user.email}</span>
        </div>
        {isSelf && <span className="self-chip">You</span>}
      </div>

      <div className="user-card-controls">
        <label>
          <span>Role</span>
          <select value={draft.role} disabled={isSelf} onChange={(event) => setDraft({ ...draft, role: event.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="status-control">
          <span>Account status</span>
          <label className="clean-switch">
            <input type="checkbox" checked={draft.isActive} disabled={isSelf} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
            <i />
            <b>{draft.isActive ? 'Active' : 'Inactive'}</b>
          </label>
        </div>
      </div>

      <div className="user-card-meta"><span>Joined</span><strong>{joined}</strong></div>

      <div className="user-card-actions">
        <button
          className="button button-primary small"
          type="button"
          disabled={!dirty || saving || draft.name.trim().length < 2}
          onClick={() => onSave(user.id, { name: draft.name.trim(), role: draft.role, isActive: draft.isActive })}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button className="button button-danger-quiet small" type="button" disabled={saving || isSelf} onClick={() => onDelete(user)}>
          Delete
        </button>
      </div>
    </motion.article>
  );
}

function DeleteUserModal({ user, busy, onClose, onConfirm }) {
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => !busy && onClose()}>
      <motion.div
        className="modern-modal clean-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        initial={{ y: 16, opacity: 0, scale: .98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="eyebrow danger-text">Delete account</span>
        <h2 id="delete-user-title">Delete {user.name}?</h2>
        <p>This removes the user and all workspaces owned by this account. This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="button button-ghost" type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="button button-danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Deleting…' : 'Delete user'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Users() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const { items, status, savingId } = useSelector((state) => state.users);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => { if (status === 'idle') dispatch(fetchUsers()); }, [dispatch, status]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((user) => (!term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) && (roleFilter === 'all' || user.role === roleFilter));
  }, [items, query, roleFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    admins: items.filter((user) => user.role === 'admin').length,
    active: items.filter((user) => user.isActive).length,
  }), [items]);

  const handleSave = async (id, changes) => {
    const result = await dispatch(updateUser({ id, changes }));
    if (updateUser.fulfilled.match(result)) {
      toast.success('User updated');
      if (Number(id) === Number(currentUser.id)) dispatch(fetchMe());
    } else toast.error(result.payload || 'Unable to update user');
  };

  const confirmDelete = async () => {
    const result = await dispatch(deleteUser(deletingUser.id));
    if (deleteUser.fulfilled.match(result)) {
      toast.success('User deleted');
      setDeletingUser(null);
    } else toast.error(result.payload || 'Unable to delete user');
  };

  return (
    <div className="page-stack users-page-clean">
      <section className="page-header clean-section-header">
        <div><span className="eyebrow">Administration</span><h1>User management</h1><p>Manage account roles and access from one simple view.</p></div>
        <button className="button button-ghost" type="button" onClick={() => dispatch(fetchUsers())}>Refresh</button>
      </section>

      <section className="user-summary-row" aria-label="User summary">
        <div><span>Total users</span><strong>{stats.total}</strong></div>
        <div><span>Administrators</span><strong>{stats.admins}</strong></div>
        <div><span>Active accounts</span><strong>{stats.active}</strong></div>
      </section>

      <section className="user-toolbar-clean">
        <label className="user-search-clean">
          <span className="sr-only">Search users</span>
          <input type="search" placeholder="Search name or email" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="admin">Administrators</option>
          <option value="user">Users</option>
        </select>
      </section>

      {status === 'loading' && items.length === 0 ? (
        <div className="users-card-grid">{[1, 2, 3, 4].map((item) => <div className="user-card-skeleton skeleton" key={item} />)}</div>
      ) : filteredUsers.length ? (
        <div className="users-card-grid">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} currentUserId={currentUser.id} saving={Number(savingId) === Number(user.id)} onSave={handleSave} onDelete={setDeletingUser} />
          ))}
        </div>
      ) : <div className="empty-state user-empty-clean"><p>No users match the current filters.</p></div>}

      <AnimatePresence>
        {deletingUser && <DeleteUserModal user={deletingUser} busy={Number(savingId) === Number(deletingUser.id)} onClose={() => setDeletingUser(null)} onConfirm={confirmDelete} />}
      </AnimatePresence>
    </div>
  );
}
