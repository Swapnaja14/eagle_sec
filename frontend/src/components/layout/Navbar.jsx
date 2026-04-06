import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/content/upload', label: 'Content Hub' },
    { to: '/courses', label: 'Course Builder' },
  ]

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <NavLink to="/dashboard" className="navbar-logo">
          <div className="navbar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="#3b82f6"/>
              <path d="M8 10h16M8 16h10M8 22h13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="22" r="4" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="navbar-logo-text">LearnSphere</span>
          {user?.tenant && <span className="navbar-tenant">{user.tenant.name}</span>}
        </NavLink>

        {/* Nav Links */}
        <div className="navbar-links">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          {/* Notifications */}
          <button className="navbar-icon-btn" title="Notifications">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* User menu */}
          <div className="navbar-user" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="navbar-avatar">{initials}</div>
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user?.first_name || user?.username}</span>
              <span className="navbar-user-role">{user?.role}</span>
            </div>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{color: 'var(--text-muted)'}}>
              <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>

            {menuOpen && (
              <div className="navbar-dropdown">
                <div className="navbar-dropdown-header">
                  <p className="navbar-dropdown-name">{user?.first_name} {user?.last_name}</p>
                  <p className="navbar-dropdown-email">{user?.email}</p>
                </div>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button className="navbar-dropdown-item danger" onClick={logout}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
