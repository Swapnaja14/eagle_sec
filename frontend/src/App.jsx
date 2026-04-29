import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'

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

// ─── TRAINEE PAGES ────────────────────────────────────────────────────────────
import TraineeDashboardPage from './pages/TraineeDashboardPage'
import MyTrainingHistoryPage from './pages/MyTrainingHistoryPage'
import TakeAssessmentPage from './pages/TakeAssessmentPage'
import MyCertificatesPage from './pages/MyCertificatesPage'

// ─── ASSESSMENT PAGES ─────────────────────────────────────────────────────────
import AssessmentsListPage from './pages/AssessmentsListPage'
import AssessmentCreationPage from './pages/AssessmentCreationPage'
import AssessmentDetailPage from './pages/AssessmentDetailPage'
import TakeQuizPage from './pages/TakeQuizPage'
import QuizResultsPage from './pages/QuizResultsPage'

import './index.css'

// ─── ROLE REDIRECT MAP ────────────────────────────────────────────────────────
const ROLE_HOME = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  trainer: '/trainer/dashboard',
  trainee: '/trainee/dashboard',
}

// ─── GUARDS ───────────────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  // Shorthand wrappers
  const P = ({ children, roles }) => (
    <ProtectedRoute allowedRoles={roles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )

  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role] || '/admin/dashboard'} replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={user ? (ROLE_HOME[user.role] || '/admin/dashboard') : '/login'} replace />} />

      {/* ─── SUPER ADMIN + ADMIN ───────────────────────────────────────── */}
      <Route path="/admin/dashboard" element={<P roles={['superadmin', 'admin']}><DashboardPage /></P>} />
      <Route path="/admin/psara" element={<P roles={['superadmin', 'admin']}><PSARADashboardPage /></P>} />
      <Route path="/admin/analytics" element={<P roles={['superadmin', 'admin']}><AnalyticsReportPage /></P>} />
      <Route path="/admin/gap-analysis" element={<P roles={['superadmin', 'admin']}><GapAnalysisPage /></P>} />
      <Route path="/employee/history" element={<P roles={['superadmin', 'admin']}><EmployeeHistoryPage /></P>} />
      <Route path="/admin/calendar" element={<P roles={['superadmin', 'admin', 'trainer', 'trainee']}><TrainingCalendarPage /></P>} />
      <Route path="/admin/sites" element={<P roles={['superadmin', 'admin']}><SiteManagementPage /></P>} />
      <Route path="/admin/users/bulk" element={<P roles={['superadmin', 'admin']}><BulkUserUploadPage /></P>} />
      <Route path="/reports/export" element={<P roles={['superadmin', 'admin']}><BulkExportPage /></P>} />

      {/* SUPER ADMIN ONLY */}
      <Route path="/admin/rbac" element={<P roles={['superadmin']}><RBACManagementPage /></P>} />
      <Route path="/admin/audit-logs" element={<P roles={['superadmin']}><AuditLogPage /></P>} />
      <Route path="/admin/certificates" element={<P roles={['superadmin', 'admin']}><CertificateIssuingPage /></P>} />

      {/* ─── SHARED: ADMIN + TRAINER ───────────────────────────────────── */}
      <Route path="/sessions/classroom/new" element={<P roles={['superadmin', 'admin', 'trainer']}><SessionSchedulerPage /></P>} />
      <Route path="/sessions/virtual/new" element={<P roles={['superadmin', 'admin', 'trainer']}><SessionSchedulerPage /></P>} />
      <Route path="/sessions/quiz-results" element={<P roles={['superadmin', 'admin', 'trainer']}><QuizResultsPage /></P>} />
      <Route path="/content/upload" element={<P roles={['superadmin', 'admin', 'trainer']}><ContentUploadPage /></P>} />
      <Route path="/courses" element={<P roles={['superadmin', 'admin', 'trainer']}><CoursesListPage /></P>} />
      <Route path="/courses/new" element={<P roles={['superadmin', 'admin', 'trainer']}><CourseBuilderPage /></P>} />
      <Route path="/courses/:id/builder" element={<P roles={['superadmin', 'admin', 'trainer']}><CourseBuilderPage /></P>} />
      <Route path="/questions/manage" element={<P roles={['superadmin', 'admin', 'trainer']}><QuestionBankPage /></P>} />

      {/* ─── ASSESSMENTS ───────────────────────────────────────────────── */}
      <Route path="/assessments" element={<P roles={['superadmin', 'admin', 'trainer']}><AssessmentsListPage /></P>} />
      <Route path="/assessments/create" element={<P roles={['superadmin', 'admin', 'trainer']}><AssessmentCreationPage /></P>} />
      <Route path="/assessments/:id" element={<P roles={['superadmin', 'admin', 'trainer']}><AssessmentDetailPage /></P>} />
      <Route path="/assessments/:id/edit" element={<P roles={['superadmin', 'admin', 'trainer']}><AssessmentCreationPage /></P>} />
      <Route path="/quiz/:quizId/take" element={<P roles={['superadmin', 'admin', 'trainer', 'trainee']}><TakeQuizPage /></P>} />
      <Route path="/quiz-results/:submissionId" element={<P roles={['superadmin', 'admin', 'trainer', 'trainee']}><QuizResultsPage /></P>} />

      {/* ─── TRAINER PORTAL ────────────────────────────────────────────── */}
      <Route path="/trainer/dashboard" element={<P roles={['trainer']}><TrainerDashboardPage /></P>} />
      <Route path="/trainer/sessions" element={<P roles={['trainer']}><MySessionsPage /></P>} />

      {/* ─── TRAINEE PORTAL ────────────────────────────────────────────── */}
      <Route path="/trainee/dashboard" element={<P roles={['trainee']}><TraineeDashboardPage /></P>} />
      <Route path="/trainee/my-training" element={<P roles={['trainee']}><MyTrainingHistoryPage /></P>} />
      <Route path="/trainee/assessments" element={<P roles={['trainee']}><TakeAssessmentPage /></P>} />
      <Route path="/trainee/certificates" element={<P roles={['trainee']}><MyCertificatesPage /></P>} />

      {/* CATCH-ALL */}
      <Route path="*" element={<Navigate to={user ? (ROLE_HOME[user.role] || '/admin/dashboard') : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
