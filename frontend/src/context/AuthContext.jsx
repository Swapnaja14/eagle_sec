import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

// ─── ROLE MAP: backend role → frontend role ───────────────────────────────────
// Backend: superadmin | admin | instructor | trainee
// Frontend: superadmin | admin | trainer | trainee
const mapBackendRole = (backendRole) => {
  const map = { superadmin: 'superadmin', admin: 'admin', instructor: 'trainer', trainee: 'trainee' }
  return map[backendRole] || backendRole
}

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard', 'psara', 'analytics', 'gap_analysis', 'training_history',
    'calendar', 'schedule_session', 'course_builder', 'content_hub',
    'question_bank', 'quiz_results', 'evaluations', 'bulk_export',
    'rbac', 'sites', 'bulk_users', 'audit_logs',
  ],
  admin: [
    'dashboard', 'psara', 'analytics', 'gap_analysis', 'training_history',
    'calendar', 'schedule_session', 'course_builder', 'content_hub',
    'question_bank', 'quiz_results', 'evaluations', 'bulk_export',
    'sites', 'bulk_users',
  ],
  trainer: [
    'trainer_dashboard', 'my_sessions', 'calendar', 'schedule_session',
    'course_builder', 'content_hub', 'question_bank', 'quiz_results',
    'evaluations_view',
  ],
  trainee: [
    'trainee_dashboard', 'my_training', 'take_assessment',
    'my_certificates', 'calendar', 'evaluations_submit',
  ],
}

export const hasPermission = (user, permission) => {
  if (!user) return false
  return (ROLE_PERMISSIONS[user.role] || []).includes(permission)
}

// ─── AUTH PROVIDER ────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: restore user from localStorage
  const restoreUser = useCallback(async () => {
    const stored = localStorage.getItem('learnsphere_user')
    if (stored) {
      try {
        JSON.parse(stored)
        // Real user: verify token is still valid by hitting /me
        const token = localStorage.getItem('access_token')
        if (token) {
          try {
            const { data } = await authAPI.me()
            const role = mapBackendRole(data.role)
            const userObj = { ...data, role }
            setUser(userObj)
            localStorage.setItem('learnsphere_user', JSON.stringify(userObj))
          } catch {
            // Token expired — clear everything
            _clearStorage()
          }
        }
      } catch {
        _clearStorage()
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { restoreUser() }, [restoreUser])

  const _clearStorage = () => {
    localStorage.removeItem('learnsphere_user')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // ── REAL LOGIN (calls backend) ─────────────────────────────────────────────
  const login = async (credentials) => {
    const { username, password } = credentials

    try {
      const { data } = await authAPI.login({ username, password })
      // Backend returns: { access, refresh, user: { id, username, role, ... } }
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)

      const role = mapBackendRole(data.user.role)
      const userObj = { ...data.user, role }
      localStorage.setItem('learnsphere_user', JSON.stringify(userObj))
      setUser(userObj)
      return userObj
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data
      if (typeof detail === 'string') throw new Error(detail)
      if (typeof detail === 'object') throw new Error(Object.values(detail).flat().join(' '))
      throw new Error('Invalid credentials.')
    }
  }

  const register = async (formData) => {
    try {
      const { data } = await authAPI.register(formData)
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      const role = mapBackendRole(data.user.role)
      const userObj = { ...data.user, role }
      localStorage.setItem('learnsphere_user', JSON.stringify(userObj))
      setUser(userObj)
      return userObj
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'string') throw new Error(detail)
      if (typeof detail === 'object') throw new Error(Object.values(detail).flat().join(' '))
      throw new Error('Registration failed.')
    }
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    _clearStorage()
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      register,
      hasPermission: (perm) => hasPermission(user, perm),
      isRealUser: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
