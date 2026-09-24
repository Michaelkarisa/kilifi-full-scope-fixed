/**
 * AppRoute — protected route wrapper.
 *
 * Usage:
 *   <AppRoute isAuthenticated={bool} isLoading={bool}>
 *     <ProtectedPage />
 *   </AppRoute>
 *
 * - While auth is resolving  → shows a full-screen spinner
 * - Not authenticated        → redirects to / with `?next=<current path>` preserved
 * - Authenticated            → renders children
 */
import { Navigate, useLocation } from 'react-router-dom';

export default function AppRoute({ isAuthenticated, isLoading, children }) {
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid #e5e7eb',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ color: '#6b7280', fontSize: 14 }}>Checking session…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return children;
}
