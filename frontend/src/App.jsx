/**
 * App Component
 *
 * Main app component with React Router configuration.
 * Handles routing for landing, dashboard, and portal sections.
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import { landingAPI } from './services/api';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import PortalLayout from './layouts/PortalLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DocumentVerify from './pages/DocumentVerify';
import SiteDisabled from './pages/SiteDisabled';

// Dashboard pages (staff)
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientsPage from './pages/dashboard/ClientsPage';
import CasesPage from './pages/dashboard/CasesPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import AppointmentsPage from './pages/dashboard/AppointmentsPage';
import AvailabilityPage from './pages/dashboard/AvailabilityPage';
import LandingAdminPage from './pages/dashboard/LandingAdminPage';

// Portal pages (client)
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalCasesPage from './pages/portal/PortalCasesPage';
import PortalDocumentsPage from './pages/portal/PortalDocumentsPage';
import PortalAppointmentsPage from './pages/portal/PortalAppointmentsPage';

function App() {
  const { loadUser } = useAuthStore();
  const [siteStatus, setSiteStatus] = useState(null); // null = loading

  // Load user from localStorage on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Check if the site is currently active (payment / manual disable control)
  useEffect(() => {
    landingAPI.public.siteStatus()
      .then((res) => setSiteStatus(res.data))
      .catch(() => setSiteStatus({ is_active: true })); // fail open — don't block on API error
  }, []);

  // While checking site status, render nothing (avoids flash of content)
  if (siteStatus === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Site is disabled — admins can still access /admin (served by Django, not React)
  if (!siteStatus.is_active) {
    return (
      <SiteDisabled
        title={siteStatus.maintenance_title}
        message={siteStatus.maintenance_message}
        contactEmail={siteStatus.contact_email}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/documents/verify" element={<DocumentVerify />} />

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
                    <Route path="availability" element={<AvailabilityPage />} />
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
                <PortalLayout>
                  <Routes>
                    <Route index element={<Navigate to="/portal/dashboard" replace />} />
                    <Route path="dashboard" element={<PortalDashboard />} />
                    <Route path="cases" element={<PortalCasesPage />} />
                    <Route path="documents" element={<PortalDocumentsPage />} />
                    <Route path="appointments" element={<PortalAppointmentsPage />} />
                  </Routes>
                </PortalLayout>
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
