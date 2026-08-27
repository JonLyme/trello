import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { clearAuthMessage, signUp } from '../features/auth/authSlice.js';
import FormFieldIcon from '../components/FormFieldIcon.jsx';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/gu;
const normalizeName = (value) => String(value ?? '').normalize('NFC').replace(INVISIBLE_CHARACTERS, '').trim().replace(/\s+/gu, ' ');
const characterCount = (value) => Array.from(value).length;
function getFormText(formData, fieldName, fallback = '') {
  const value = formData.get(fieldName);
  return typeof value === 'string' ? value : String(fallback ?? '');
}

export default function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const nameRef = useRef(null);
  const { token, user, status } = useSelector((state) => state.auth);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => () => {
    dispatch(clearAuthMessage());
    if (preview) URL.revokeObjectURL(preview);
  }, [dispatch, preview]);

  if (token && user) return <Navigate to="/" replace />;

  const selectAvatar = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) return toast.error('Use a JPEG, PNG, or WebP avatar.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Avatar must be 5 MB or smaller.');
    if (preview) URL.revokeObjectURL(preview);
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const submittedForm = new FormData(event.currentTarget);
    const name = normalizeName(getFormText(submittedForm, 'name', form.name));
    const email = getFormText(submittedForm, 'email', form.email).trim();
    const password = getFormText(submittedForm, 'password', form.password);
    const confirmPassword = getFormText(submittedForm, 'confirmPassword', form.confirmPassword);
    const nameLength = characterCount(name);
    if (nameLength < 2 || nameLength > 100) {
      nameRef.current?.focus();
      return toast.error('Enter your full name using 2 to 100 characters.');
    }
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    const result = await dispatch(signUp({ name, email, password, avatar }));
    if (signUp.fulfilled.match(result)) {
      toast.success(result.payload?.message || 'Account created');
      navigate('/', { replace: true });
    } else toast.error(result.payload || 'Unable to create account');
  };

  return (
    <main className="auth-page auth-page-clean auth-page-signup">
      <section className="auth-brand-panel auth-brand-wolf" aria-label="Wolf Group">
        <motion.div className="auth-brand-motion" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55 }}>
          <motion.span className="auth-brand-ring" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} />
          <motion.h1 animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>Wolf Group</motion.h1>
          <p>Create your account. Build your workspace.</p>
        </motion.div>
      </section>

      <section className="auth-panel auth-panel-clean">
        <motion.div className="auth-card-clean signup-card-clean" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.38, delay: 0.08 }}>
          <div className="auth-mobile-logo">Wolf Group</div>
          <span className="eyebrow">Get started</span>
          <h2>Create account</h2>
          <p className="muted">Set up your profile and start organizing projects.</p>

          <form className="form-stack clean-form" onSubmit={handleSubmit} noValidate>
            <div className="signup-avatar-picker signup-avatar-clean">
              <button type="button" className="signup-avatar-preview" onClick={() => fileRef.current?.click()} aria-label="Choose avatar">
                {preview ? <img src={preview} alt="Selected avatar preview" /> : <span>{form.name.trim().slice(0, 1).toUpperCase() || '+'}</span>}
              </button>
              <div><strong>Profile photo</strong><p>Optional · JPEG, PNG or WebP · Max 5 MB</p><button type="button" className="text-button" onClick={() => fileRef.current?.click()}>{avatar ? 'Choose another' : 'Choose image'}</button></div>
              <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectAvatar(event.target.files?.[0])} />
            </div>

            <label><span>Full name</span><div className="input-with-icon"><FormFieldIcon type="user" /><input ref={nameRef} name="name" type="text" autoComplete="name" required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" /></div></label>
            <label><span>Email address</span><div className="input-with-icon"><FormFieldIcon type="email" /><input name="email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div></label>
            <div className="field-grid">
              <label><span>Password</span><div className="input-with-icon"><FormFieldIcon type="lock" /><input name="password" type="password" autoComplete="new-password" required minLength="8" maxLength="72" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8+ characters" /></div></label>
              <label><span>Confirm password</span><div className="input-with-icon"><FormFieldIcon type="lock" /><input name="confirmPassword" type="password" autoComplete="new-password" required minLength="8" maxLength="72" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Repeat password" /></div></label>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} className="button button-primary full clean-submit" disabled={status === 'loading'} type="submit">{status === 'loading' ? 'Creating account…' : 'Create account'}</motion.button>
          </form>
          <p className="auth-switch">Already registered? <Link to="/signin">Sign in</Link></p>
        </motion.div>
      </section>
    </main>
  );
}
