/**
 * Role Protected Route Component
 *
 * Wrapper component that requires specific user roles.
 * Redirects to appropriate dashboard if user doesn't have required role.
 */

import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function RoleProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'client') {
      return <Navigate to="/portal/dashboard" replace />;
    } else if (user.role === 'boss' || user.role === 'employe') {
      return <Navigate to="/dashboard/home" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleProtectedRoute;
