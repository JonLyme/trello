import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UserPencil } from '@tailgrids/icons';
import { uploadAvatar } from '../features/auth/authSlice.js';
import AvatarImage from './AvatarImage.jsx';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function AvatarUpload() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const uploading = useSelector((state) => state.auth.avatarStatus === 'loading');
  const ref = useRef(null);
  const [preview, setPreview] = useState('');
  const isActive = user?.isActive !== false;

  const select = async (file) => {
    if (!file) return;
    if (!TYPES.has(file.type)) return toast.error('Use a JPEG, PNG, or WebP avatar.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Avatar must be 5 MB or smaller.');

    const url = URL.createObjectURL(file);
    setPreview(url);
    const data = new FormData();
    data.append('avatar', file);
    const result = await dispatch(uploadAvatar(data));
    URL.revokeObjectURL(url);
    setPreview('');
    uploadAvatar.fulfilled.match(result)
      ? toast.success('Avatar updated')
      : toast.error(result.payload || 'Avatar upload failed');
  };

  return (
    <div className="avatar-editor-clean">
      <div className="avatar-editor-preview">
        {preview
          ? <img className="avatar avatar-image avatar-editor-image" src={preview} alt="Avatar preview" />
          : <AvatarImage user={user} className="avatar-editor-image" />}
        <span className={`avatar-editor-status ${isActive ? 'active' : 'inactive'}`} />
      </div>

      <div className="avatar-editor-copy">
        <strong>{user?.name}</strong>
        <span>{user?.email}</span>
        <small>JPEG, PNG or WebP · Maximum 5 MB</small>
      </div>

      <input ref={ref} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => select(event.target.files?.[0])} />
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="button button-ghost avatar-editor-button"
        type="button"
        disabled={uploading}
        onClick={() => ref.current?.click()}
      >
        <UserPencil />
        <span>{uploading ? 'Uploading…' : 'Change photo'}</span>
      </motion.button>
    </div>
  );
}
