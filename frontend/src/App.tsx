import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LandingPage from './pages/public/LandingPage';
import { CommandPalette } from './components/ui/CommandPalette';

// Lazy-load all heavy pages for performance
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const PlacementsPage = lazy(() => import('./pages/placements/PlacementsPage'));
const PlacementDetail = lazy(() => import('./pages/placements/PlacementDetail'));
const PlacementWizard = lazy(() => import('./pages/placements/PlacementWizard'));
const StudentsPage = lazy(() => import('./pages/students/StudentsPage'));
const StudentProfile = lazy(() => import('./pages/students/StudentProfile'));
const HostsPage = lazy(() => import('./pages/hosts/HostsPage'));
const HostDetailPage = lazy(() => import('./pages/hosts/HostDetailPage'));
const SupervisorsPage = lazy(() => import('./pages/supervisors/SupervisorsPage'));
const SupervisorProfile = lazy(() => import('./pages/supervisors/SupervisorProfile'));
const ComplianceDashboard = lazy(() => import('./pages/compliance/ComplianceDashboard'));
const ComplianceReports = lazy(() => import('./pages/compliance/ComplianceReports'));
const AuditReport = lazy(() => import('./pages/reports/AuditReport'));
const AuditCentre = lazy(() => import('./pages/audit/AuditCentre'));
const ReportsCentre = lazy(() => import('./pages/reports/ReportsCentre'));
const DocumentVault = lazy(() => import('./pages/documents/DocumentVault'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const UserManagement = lazy(() => import('./pages/settings/UserManagement'));
const WorkflowDesigner = lazy(() => import('./pages/settings/WorkflowDesigner'));
const DataImport = lazy(() => import('./pages/settings/DataImport'));
const NotificationCentre = lazy(() => import('./pages/notifications/NotificationCentre'));
const NotificationHub = lazy(() => import('./pages/notifications/NotificationHub'));
const ReadinessReport = lazy(() => import('./pages/reports/ReadinessReport'));
const AuditViewer = lazy(() => import('./pages/reports/AuditViewer'));
const OrganizationSettings = lazy(() => import('./pages/settings/OrganizationSettings'));
const ProductAnalytics = lazy(() => import('./pages/analytics/ProductAnalytics'));

// Portals
const StudentPortal = lazy(() => import('./pages/student/StudentPortal'));
const StudentOnboarding = lazy(() => import('./pages/student/StudentOnboarding'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));
const SupervisorPortal = lazy(() => import('./pages/supervisor/SupervisorPortal'));
const TrainerPortal = lazy(() => import('./pages/trainer/TrainerPortal'));
const HostPortal = lazy(() => import('./pages/portals/HostPortal'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 0.75rem' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Loading…</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <CommandPalette />
      <Routes>
        {/* ─── Public Routes ──────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ─── Protected Routes ────────────────────────────────── */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Command Centre */}
        <Route path="/dashboard" element={
          <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
        } />

        {/* Portals */}
        <Route path="portal/student" element={
          <Suspense fallback={<PageLoader />}><StudentPortal /></Suspense>
        } />
        <Route path="onboarding" element={
          <Suspense fallback={<PageLoader />}><StudentOnboarding /></Suspense>
        } />
        <Route path="onboarding/wizard" element={
          <Suspense fallback={<PageLoader />}><OnboardingWizard /></Suspense>
        } />
        <Route path="portal/supervisor" element={
          <Suspense fallback={<PageLoader />}><SupervisorPortal /></Suspense>
        } />
        <Route path="portal/trainer" element={
          <Suspense fallback={<PageLoader />}><TrainerPortal /></Suspense>
        } />
        <Route path="portal/host" element={
          <Suspense fallback={<PageLoader />}><HostPortal /></Suspense>
        } />

        {/* Placements Workflow */}
        <Route path="placements" element={
          <Suspense fallback={<PageLoader />}><PlacementsPage /></Suspense>
        } />
        <Route path="placements/:id" element={
          <Suspense fallback={<PageLoader />}><PlacementDetail /></Suspense>
        } />
        <Route path="placements/wizard" element={
          <Suspense fallback={<PageLoader />}><PlacementWizard /></Suspense>
        } />
        <Route path="placements/:id/report" element={
          <Suspense fallback={<PageLoader />}><AuditReport /></Suspense>
        } />

        {/* Students */}
        <Route path="students" element={
          <Suspense fallback={<PageLoader />}><StudentsPage /></Suspense>
        } />
        <Route path="students/:id" element={
          <Suspense fallback={<PageLoader />}><StudentProfile /></Suspense>
        } />

        {/* Host Facilities */}
        <Route path="hosts" element={
          <Suspense fallback={<PageLoader />}><HostsPage /></Suspense>
        } />
        <Route path="hosts/:id" element={
          <Suspense fallback={<PageLoader />}><HostDetailPage /></Suspense>
        } />

        {/* Supervisors */}
        <Route path="supervisors" element={
          <Suspense fallback={<PageLoader />}><SupervisorsPage /></Suspense>
        } />
        <Route path="supervisors/:id" element={
          <Suspense fallback={<PageLoader />}><SupervisorProfile /></Suspense>
        } />

        {/* Intelligence */}
        <Route path="compliance">
          <Route index element={
            <Suspense fallback={<PageLoader />}><ComplianceDashboard /></Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<PageLoader />}><ComplianceReports /></Suspense>
          } />
        </Route>
        <Route path="audit" element={
          <Suspense fallback={<PageLoader />}><AuditCentre /></Suspense>
        } />
        <Route path="reports" element={
          <Suspense fallback={<PageLoader />}><ReportsCentre /></Suspense>
        } />
        <Route path="reports/audit" element={
          <Suspense fallback={<PageLoader />}><AuditReport /></Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<PageLoader />}><ProductAnalytics /></Suspense>
        } />

        {/* Document Vault */}
        <Route path="documents" element={
          <Suspense fallback={<PageLoader />}><DocumentVault /></Suspense>
        } />

        {/* Settings & Users */}
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>
        } />
        <Route path="settings/workflows" element={
          <Suspense fallback={<PageLoader />}><WorkflowDesigner /></Suspense>
        } />
        <Route path="settings/import" element={
          <Suspense fallback={<PageLoader />}><DataImport /></Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<PageLoader />}><UserManagement /></Suspense>
        } />
        <Route path="system/readiness" element={
          <Suspense fallback={<PageLoader />}><ReadinessReport /></Suspense>
        } />
        <Route path="system/audit" element={
          <Suspense fallback={<PageLoader />}><AuditViewer /></Suspense>
        } />
        <Route path="settings/organization" element={
          <Suspense fallback={<PageLoader />}><OrganizationSettings /></Suspense>
        } />
        
        {/* Notifications */}
        <Route path="notifications" element={
          <Suspense fallback={<PageLoader />}><NotificationCentre /></Suspense>
        } />
        <Route path="notifications/preferences" element={
          <Suspense fallback={<PageLoader />}><NotificationHub /></Suspense>
        } />
      </Route>

      {/* Catch-all — go to landing for unauthenticated, dashboard otherwise handled by PrivateRoute */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
