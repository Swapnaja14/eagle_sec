import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    username: '', password: '', email: '',
    first_name: '', last_name: '', confirm_password: '',
    role: 'trainee', tenant_name: '', department: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await login({ username: form.username, password: form.password })
      } else {
        await register(form)
      }
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msg = typeof data === 'string' ? data
          : Object.values(data).flat().join(' ')
        setError(msg)
      } else {
        setError('Connection error. Make sure the backend is running.')
      }
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
            <p className="login-brand-tagline">Enterprise Learning Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Mode toggle */}
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >Sign In</button>
            <button
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >Create Account</button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'register' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" name="first_name" value={form.first_name} onChange={handleChange} placeholder="John" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@company.com" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-input" name="tenant_name" value={form.tenant_name} onChange={handleChange} placeholder="TechCorp Inc." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                      <option value="trainee">Trainee</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. john.doe"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="login-error">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                {error}
              </div>
            )}

            {mode === 'login' && (
              <div className="login-demo-hint">
                <span>Demo:</span> admin / admin123
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg login-submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{width:18,height:18}} /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                mode === 'login' ? 'Sign In to LearnSphere' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="login-footer">
          © 2024 LearnSphere — Enterprise Learning Management System
        </p>
      </div>
    </div>
  )
}
