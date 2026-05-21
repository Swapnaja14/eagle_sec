import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ConnectionStatus from './components/ConnectionStatus'

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
import LoginPage from './pages/LoginPage'

// ─── ADMIN / SUPER ADMIN PAGES ────────────────────────────────────────────────
import DashboardPage from './pages/DashboardPage'
import PSARADashboardPage from './pages/PSARADashboardPage'
import AnalyticsReportPage from './pages/AnalyticsReportPage'
import GapAnalysisPage from './pages/GapAnalysisPage'
import EmployeeHistoryPage from './pages/EmployeeHistoryPage'
import SessionSchedulerPage from './pages/SessionSchedulerPage'
import TrainingCalendarPage from './pages/TrainingCalendarPage'
import CourseBuilderPage from './pages/CourseBuilderPage'
import CoursesListPage from './pages/CoursesListPage'
import ContentUploadPage from './pages/ContentUploadPage'
import QuestionBankPage from './pages/QuestionBankPage'
import BulkExportPage from './pages/BulkExportPage'
import SiteManagementPage from './pages/SiteManagementPage'
import BulkUserUploadPage from './pages/BulkUserUploadPage'
import RBACManagementPage from './pages/RBACManagementPage'
import AuditLogPage from './pages/AuditLogPage'
import CertificateIssuingPage from './pages/CertificateIssuingPage'

// ─── TRAINER PAGES ────────────────────────────────────────────────────────────
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import MySessionsPage from './pages/MySessionsPage'

// ─── ASSESSMENT PAGES ─────────────────────────────────────────────────────────
import AssessmentsListPage from './pages/AssessmentsListPage'
import AssessmentCreationPage from './pages/AssessmentCreationPage'
import AssessmentDetailPage from './pages/AssessmentDetailPage'
import TakeQuizPage from './pages/TakeQuizPage'
import QuizResultsPage from './pages/QuizResultsPage'

import './index.css'

// ─── PROTECTED ROUTE WRAPPER ──────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    if (user.role === 'trainer') {
      return <Navigate to="/trainer/dashboard" replace />
    }
    return <Navigate to="/admin/dashboard" replace />
  }

  return <AppLayout>{children}</AppLayout>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    )
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/login"
        element={user ? (
          <Navigate to={user.role === 'trainer' ? '/trainer/dashboard' : '/admin/dashboard'} replace />
        ) : (
          <LoginPage />
        )}
      />

      <Route
        path="/"
        element={
          <Navigate
            to={user ? (user.role === 'trainer' ? '/trainer/dashboard' : '/admin/dashboard') : '/login'}
            replace
          />
        }
      />

      {/* ─── SUPER ADMIN + ADMIN ROUTES ───────────────────────────────── */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/psara" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><PSARADashboardPage /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><AnalyticsReportPage /></ProtectedRoute>} />
      <Route path="/admin/gap-analysis" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><GapAnalysisPage /></ProtectedRoute>} />
      <Route path="/employee/history" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><EmployeeHistoryPage /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><TrainingCalendarPage /></ProtectedRoute>} />
      <Route path="/admin/sites" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><SiteManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users/bulk" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><BulkUserUploadPage /></ProtectedRoute>} />
      <Route path="/reports/export" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><BulkExportPage /></ProtectedRoute>} />

      {/* SUPER ADMIN ONLY */}
      <Route path="/admin/rbac" element={<ProtectedRoute allowedRoles={['superadmin']}><RBACManagementPage /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['superadmin']}><AuditLogPage /></ProtectedRoute>} />
      <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={['superadmin', 'admin']}><CertificateIssuingPage /></ProtectedRoute>} />

      {/* ─── SHARED: ADMIN + TRAINER ───────────────────────────────────── */}
      <Route path="/sessions/classroom/new" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><SessionSchedulerPage /></ProtectedRoute>} />
      <Route path="/sessions/virtual/new" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><SessionSchedulerPage /></ProtectedRoute>} />
      <Route path="/sessions/quiz-results" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><QuizResultsPage /></ProtectedRoute>} />
      <Route path="/content/upload" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><ContentUploadPage /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><CoursesListPage /></ProtectedRoute>} />
      <Route path="/courses/new" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><CourseBuilderPage /></ProtectedRoute>} />
      <Route path="/courses/:id/builder" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><CourseBuilderPage /></ProtectedRoute>} />
      <Route path="/questions/manage" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><QuestionBankPage /></ProtectedRoute>} />

      {/* ─── ASSESSMENTS ───────────────────────────────────────────────── */}
      <Route path="/assessments" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><AssessmentsListPage /></ProtectedRoute>} />
      <Route path="/assessments/create" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><AssessmentCreationPage /></ProtectedRoute>} />
      <Route path="/assessments/:id" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><AssessmentDetailPage /></ProtectedRoute>} />
      <Route path="/assessments/:id/edit" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><AssessmentCreationPage /></ProtectedRoute>} />
      <Route path="/quiz/:quizId/take" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><TakeQuizPage /></ProtectedRoute>} />
      <Route path="/quiz-results/:submissionId" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'trainer']}><QuizResultsPage /></ProtectedRoute>} />

      {/* ─── TRAINER PORTAL ────────────────────────────────────────────── */}
      <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={['trainer']}><TrainerDashboardPage /></ProtectedRoute>} />
      <Route path="/trainer/sessions" element={<ProtectedRoute allowedRoles={['trainer']}><MySessionsPage /></ProtectedRoute>} />

      {/* CATCH-ALL */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (user.role === 'trainer' ? '/trainer/dashboard' : '/admin/dashboard') : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConnectionStatus />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
