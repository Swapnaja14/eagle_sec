import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContentUploadPage from './pages/ContentUploadPage'
import CourseBuilderPage from './pages/CourseBuilderPage'
import CoursesListPage from './pages/CoursesListPage'
import Navbar from './components/layout/Navbar'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div className="spinner" style={{width:40,height:40,borderWidth:3}} />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <Navbar />
      <main style={{flex:1}}>{children}</main>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><DashboardPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/content/upload" element={
        <ProtectedRoute>
          <AppLayout><ContentUploadPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/courses" element={
        <ProtectedRoute>
          <AppLayout><CoursesListPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/courses/new" element={
        <ProtectedRoute>
          <AppLayout><CourseBuilderPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/courses/:id/builder" element={
        <ProtectedRoute>
          <AppLayout><CourseBuilderPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
