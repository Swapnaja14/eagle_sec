import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext'
import './Login.css'

const ROLE_REDIRECT = {
  superadmin: '/admin/dashboard',
  admin: '/admin/dashboard',
  trainer: '/trainer/dashboard',
  trainee: '/trainee/dashboard',
}

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginAs } = useAuth()
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
      const user = await login({ username: form.username, password: form.password })
      navigate(ROLE_REDIRECT[user.role] || '/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (account) => {
    const user = loginAs(account)
    navigate(ROLE_REDIRECT[user.role] || '/admin/dashboard')
  }

  const ROLE_BADGE_STYLES = {
    superadmin: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    admin:      { background: 'rgba(59,130,246,0.15)',  color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' },
    trainer:    { background: 'rgba(34,197,94,0.15)',   color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
    trainee:    { background: 'rgba(245,158,11,0.15)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' },
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container" style={{ maxWidth: 900, width: '100%' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: Login Form */}
          <div className="login-card">
            <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 800 }}>Sign In</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Enter your credentials or use a demo account →</p>

            {error && (
              <div className="form-error-box" style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Employee ID / Username</label>
                <input
                  className="form-input"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. admin"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In to LearnSphere'}
              </button>
            </form>

            <p className="login-footer" style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              © 2026 LearnSphere — Training & Compliance Portal
            </p>
          </div>

          {/* Right: Demo Accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
              ⚡ Quick Demo Access
            </div>
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.role}
                onClick={() => handleDemoLogin(account)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border-color)`,
                  borderRadius: 12, cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = account.badgeText; e.currentTarget.style.background = account.badgeColor }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{account.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{account.first_name} {account.last_name}</span>
                    <span style={{ ...ROLE_BADGE_STYLES[account.role], padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                      {account.roleLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {account.description}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {account.username} / {account.password}
                  </div>
                </div>
                <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
