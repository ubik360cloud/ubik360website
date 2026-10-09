import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore.js';
import Layout from './Layout.jsx';

export default function ProtectedRoute({ children }) {
  const { hydrated, ownerChecked, session, isOwner } = useAuth();
  if (!hydrated || !ownerChecked) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading…</div>;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (!isOwner) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p>This account isn't authorized for the Growth Hub.</p>
      </div>
    );
  }
  return <Layout>{children}</Layout>;
}
