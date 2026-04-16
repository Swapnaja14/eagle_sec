import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const ROLE_REDIRECT = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  trainer: '/trainer/dashboard',
  trainee: '/trainee/dashboard',
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'trainee',
    department: '',
    tenant_name: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleLoginChange = (e) => {
    setLoginForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleRegisterChange = (e) => {
    setRegisterForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const user = await login({ username: loginForm.username, password: loginForm.password })
      navigate(ROLE_REDIRECT[user.role] || '/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...registerForm,
        tenant_name: registerForm.tenant_name.trim() || undefined,
        department: registerForm.department.trim() || undefined,
      }
      const user = await register(payload)
      setSuccess('Registration successful. You are now signed in.')
      navigate(ROLE_REDIRECT[user.role] || '/trainee/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="#3b82f6"/>
              <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="22" r="4" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <div>
            <h1 className="login-brand-name">LearnSphere</h1>
            <p className="login-brand-tagline">Training & Compliance Portal</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button className={`login-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setError(''); setSuccess('') }} type="button">
              Sign In
            </button>
            <button className={`login-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setError(''); setSuccess('') }} type="button">
              Register
            </button>
          </div>

          <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 800 }}>
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {activeTab === 'login'
              ? 'Secure access to your training dashboard.'
              : 'Register with your details to get started.'}
          </p>

          {error && (
            <div className="form-error-box" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {success && (
            <div className="form-success-box" style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: '0.85rem', marginBottom: 16 }}>
              {success}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" name="username" value={loginForm.username} onChange={handleLoginChange} placeholder="e.g. EMP-12345" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" name="password" type="password" value={loginForm.password} onChange={handleLoginChange} placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-input" name="first_name" value={registerForm.first_name} onChange={handleRegisterChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" name="last_name" value={registerForm.last_name} onChange={handleRegisterChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" name="username" value={registerForm.username} onChange={handleRegisterChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" type="email" value={registerForm.email} onChange={handleRegisterChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" name="password" type="password" value={registerForm.password} onChange={handleRegisterChange} required minLength={8} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" name="confirm_password" type="password" value={registerForm.confirm_password} onChange={handleRegisterChange} required minLength={8} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" name="role" value={registerForm.role} onChange={handleRegisterChange}>
                    <option value="trainee">Trainee</option>
                    <option value="instructor">Trainer</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" name="department" value={registerForm.department} onChange={handleRegisterChange} placeholder="Optional" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company / Tenant</label>
                <input className="form-input" name="tenant_name" value={registerForm.tenant_name} onChange={handleRegisterChange} placeholder="Optional" />
              </div>
              <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create Account'}
              </button>
            </form>
          )}

          <p className="login-footer" style={{ marginTop: 24 }}>
            © 2026 LearnSphere — Training & Compliance Portal
          </p>
        </div>
      </div>
    </div>
  )
}
