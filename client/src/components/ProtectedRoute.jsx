import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const { token, user, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return (
      <main className="center-screen">
        <div className="spinner" aria-label="Loading" />
      </main>
    );
  }

  if (!token || !user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  }

  return children;
}
