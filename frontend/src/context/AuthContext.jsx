import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { authAPI } from '../services/api'

const AuthContext = createContext(null)

// ─── DEMO ACCOUNTS (quick login, bypasses backend) ───────────────────────────
export const DEMO_ACCOUNTS = [
  {
    username: 'superadmin', password: 'super123', role: 'superadmin',
    first_name: 'Suresh', last_name: 'Iyer', email: 'superadmin@learnsphere.in',
    avatar: '🔴', roleLabel: 'Super Admin',
    description: 'Full system access including RBAC and Audit Logs',
    badgeColor: 'rgba(239,68,68,0.2)', badgeText: '#ef4444',
    _isMock: true,
  },
  {
    username: 'admin', password: 'admin123', role: 'admin',
    first_name: 'Anita', last_name: 'Sharma', email: 'admin@learnsphere.in',
    avatar: '🔵', roleLabel: 'Admin / Manager',
    description: 'Manage training, employees, sites and compliance',
    badgeColor: 'rgba(59,130,246,0.2)', badgeText: '#3b82f6',
    _isMock: true,
  },
  {
    username: 'trainer', password: 'trainer123', role: 'trainer',
    first_name: 'Rajesh', last_name: 'Kumar', email: 'trainer@learnsphere.in',
    avatar: '🟢', roleLabel: 'Trainer',
    description: 'Schedule sessions, build courses, manage assessments',
    badgeColor: 'rgba(34,197,94,0.2)', badgeText: '#22c55e',
    _isMock: true,
  },
  {
    username: 'trainee', password: 'trainee123', role: 'trainee',
    first_name: 'Priya', last_name: 'Mehta', email: 'trainee@learnsphere.in',
    avatar: '🟡', roleLabel: 'Trainee / Guard',
    description: 'View your training, take assessments, download certificates',
    badgeColor: 'rgba(245,158,11,0.2)', badgeText: '#f59e0b',
    employeeId: 'EMP-10042',
    psaraExpiry: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    _isMock: true,
  },
]

// ─── ROLE MAP: backend role → frontend role ───────────────────────────────────
// Backend: admin | instructor | trainee
// Frontend: superadmin | admin | trainer | trainee
const mapBackendRole = (backendRole) => {
  const map = { admin: 'admin', instructor: 'trainer', trainee: 'trainee' }
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
        const parsed = JSON.parse(stored)
        // If it's a mock user, restore directly without hitting /me
        if (parsed._isMock) {
          setUser(parsed)
          setLoading(false)
          return
        }
        // Real user: verify token is still valid by hitting /me
        const token = localStorage.getItem('access_token')
        if (token) {
          try {
            const { data } = await authAPI.me()
            const role = mapBackendRole(data.role)
            const userObj = { ...data, role }
            setUser(userObj)
            localStorage.setItem('traintrack_user', JSON.stringify(userObj))
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

    // Check if it's a demo account (offline)
    const demoAccount = DEMO_ACCOUNTS.find(
      a => a.username === username && a.password === password
    )
    if (demoAccount) {
      return loginAs(demoAccount)
    }

    // Real backend login
    try {
      const { data } = await authAPI.login({ username, password })
      // Backend returns: { access, refresh, user: { id, username, role, ... } }
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)

      const role = mapBackendRole(data.user.role)
      const userObj = { ...data.user, role, _isMock: false }
      localStorage.setItem('learnsphere_user', JSON.stringify(userObj))
      setUser(userObj)
      return userObj
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data
      if (typeof detail === 'string') throw new Error(detail)
      if (typeof detail === 'object') throw new Error(Object.values(detail).flat().join(' '))
      throw new Error('Invalid credentials. Try a demo account or check your backend connection.')
    }
  }

  // ── INSTANT DEMO LOGIN (no backend) ───────────────────────────────────────
  const loginAs = (account) => {
    const { password: _pw, ...userObj } = account
    localStorage.setItem('learnsphere_user', JSON.stringify(userObj))
    // Clear any real tokens so api.js doesn't send them
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(userObj)
    return userObj
  }

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    _clearStorage()
  }

  // Legacy compat
  const register = async (formData) => login(formData)

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      loginAs,
      logout,
      register,
      hasPermission: (perm) => hasPermission(user, perm),
      isRealUser: user && !user._isMock,
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
