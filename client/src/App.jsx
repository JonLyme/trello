import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { fetchMe } from './features/auth/authSlice.js';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Users from './pages/Users.jsx';
import WorkPlace from './pages/WorkPlace.jsx';
import Welcome from './pages/Welcome.jsx';
import TodoManager from './pages/TodoManager.jsx';
import AccessDenied from './pages/AccessDenied.jsx';
import CommentNotifications from './components/CommentNotifications.jsx';

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !initialized) dispatch(fetchMe());
  }, [dispatch, initialized, token]);

  return (
    <>
      <CommentNotifications />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Welcome />} />
            <Route path="overview" element={<Dashboard />} />
            <Route path="workspaces" element={<WorkPlace />} />
            <Route path="dashboard" element={<Navigate to="/workspaces" replace />} />
            <Route path="workspaces/:workspaceId/todos" element={<TodoManager />} />
            <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          </Route>
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/access_denined" element={<Navigate to="/access-denied" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Toaster position="top-right" toastOptions={{ duration: 3200, className: 'app-toast' }} />
    </>
  );
}
