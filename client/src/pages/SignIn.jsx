import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { clearAuthMessage, signIn } from '../features/auth/authSlice.js';
import FormFieldIcon from '../components/FormFieldIcon.jsx';

export default function SignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, status } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => () => dispatch(clearAuthMessage()), [dispatch]);
  if (token && user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(signIn({ email: form.email.trim(), password: form.password }));
    if (signIn.fulfilled.match(result)) {
      toast.success(result.payload?.message || 'Welcome back');
      navigate(location.state?.from || '/', { replace: true });
    } else {
      toast.error(result.payload || 'Unable to sign in');
    }
  };

  return (
    <main className="auth-page auth-page-clean">
      <section className="auth-brand-panel" aria-label="Trello-W">
        <motion.div
          className="auth-brand-motion"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <motion.span
            className="auth-brand-dot"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.h1
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >Trello-W</motion.h1>
          <p>Simple work. Clear progress.</p>
        </motion.div>
      </section>

      <section className="auth-panel auth-panel-clean">
        <motion.div
          className="auth-card-clean"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38, delay: 0.08 }}
        >
          <div className="auth-mobile-logo">Trello-W</div>
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in</h2>
          <p className="muted">Use your account to continue to your workspaces.</p>

          <form className="form-stack clean-form" onSubmit={handleSubmit}>
            <label>
              <span>Email address</span>
              <div className="input-with-icon">
                <FormFieldIcon type="email" />
                <input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
              </div>
            </label>
            <label>
              <span>Password</span>
              <div className="input-with-icon password-icon-field">
                <FormFieldIcon type="lock" />
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength="8" maxLength="72" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" />
                <button className="password-icon-button" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                  <FormFieldIcon type={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </label>
            <motion.button whileTap={{ scale: 0.98 }} className="button button-primary full clean-submit" disabled={status === 'loading'} type="submit">
              {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>
          <p className="auth-switch">New to Trello-W? <Link to="/signup">Create an account</Link></p>
        </motion.div>
      </section>
    </main>
  );
}
