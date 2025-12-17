/**
 * App Component
 *
 * Main app component with React Router configuration.
 * Handles routing for landing, dashboard, and portal sections.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';

// Dashboard pages (staff)
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientsPage from './pages/dashboard/ClientsPage';
import CasesPage from './pages/dashboard/CasesPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import AppointmentsPage from './pages/dashboard/AppointmentsPage';
import LandingAdminPage from './pages/dashboard/LandingAdminPage';

// Portal pages (client)
import PortalDashboard from './pages/portal/PortalDashboard';

function App() {
  const { loadUser } = useAuthStore();

  // Load user from localStorage on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard routes (staff only) */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['boss', 'employe']}>
                <DashboardLayout>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard/home" replace />} />
                    <Route path="home" element={<DashboardHome />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="cases" element={<CasesPage />} />
                    <Route path="documents" element={<DocumentsPage />} />
                    <Route path="appointments" element={<AppointmentsPage />} />
                    <Route path="landing" element={<LandingAdminPage />} />
                  </Routes>
                </DashboardLayout>
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Portal routes (clients) */}
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['client']}>
                <Routes>
                  <Route index element={<Navigate to="/portal/dashboard" replace />} />
                  <Route path="dashboard" element={<PortalDashboard />} />
                </Routes>
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
