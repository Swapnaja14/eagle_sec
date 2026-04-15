import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import './AppLayout.css';

// ─── SIDEBAR CONFIG PER ROLE ─────────────────────────────────────────────────
const SIDEBAR_NAV = {
  superadmin: [
    { section: 'Management', items: [
      { to: '/admin/dashboard', icon: '📊', label: 'Overview' },
      { to: '/admin/psara', icon: '🛡️', label: 'PSARA Compliance' },
      { to: '/admin/analytics', icon: '📈', label: 'Analytics Report' },
      { to: '/admin/gap-analysis', icon: '🔍', label: 'Gap Analysis' },
      { to: '/admin/audit-logs', icon: '📋', label: 'Audit Logs', superOnly: true },
    ]},
    { section: 'Training', items: [
      { to: '/employee/history', icon: '📜', label: 'Training History' },
      { to: '/admin/calendar', icon: '📅', label: 'Calendar' },
      { to: '/sessions/classroom/new', icon: '🏫', label: 'Schedule Session' },
    ]},
    { section: 'Courses & Content', items: [
      { to: '/courses/new', icon: '🏗️', label: 'Course Builder' },
      { to: '/content/upload', icon: '📁', label: 'Content Hub' },
    ]},
    { section: 'Assessments', items: [
      { to: '/assessments', icon: '📝', label: 'Assessments' },
      { to: '/questions/manage', icon: '❓', label: 'Question Bank' },
      { to: '/sessions/quiz-results', icon: '📋', label: 'Quiz Results' },
      { to: '/sessions/evaluate', icon: '⭐', label: 'Evaluations' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports/export', icon: '📦', label: 'Bulk Export' },
    ]},
    { section: 'System', items: [
      { to: '/admin/rbac', icon: '🔐', label: 'RBAC Management', superOnly: true },
      { to: '/admin/sites', icon: '📍', label: 'Site Management' },
      { to: '/admin/users/bulk', icon: '👥', label: 'Bulk User Upload' },
    ]},
  ],
  admin: [
    { section: 'Management', items: [
      { to: '/admin/dashboard', icon: '📊', label: 'Overview' },
      { to: '/admin/psara', icon: '🛡️', label: 'PSARA Compliance' },
      { to: '/admin/analytics', icon: '📈', label: 'Analytics Report' },
      { to: '/admin/gap-analysis', icon: '🔍', label: 'Gap Analysis' },
    ]},
    { section: 'Training', items: [
      { to: '/employee/history', icon: '📜', label: 'Training History' },
      { to: '/admin/calendar', icon: '📅', label: 'Calendar' },
      { to: '/sessions/classroom/new', icon: '🏫', label: 'Schedule Session' },
    ]},
    { section: 'Courses & Content', items: [
      { to: '/courses/new', icon: '🏗️', label: 'Course Builder' },
      { to: '/content/upload', icon: '📁', label: 'Content Hub' },
    ]},
    { section: 'Assessments', items: [
      { to: '/assessments', icon: '📝', label: 'Assessments' },
      { to: '/questions/manage', icon: '❓', label: 'Question Bank' },
      { to: '/sessions/quiz-results', icon: '📋', label: 'Quiz Results' },
      { to: '/sessions/evaluate', icon: '⭐', label: 'Evaluations' },
    ]},
    { section: 'Reports', items: [
      { to: '/reports/export', icon: '📦', label: 'Bulk Export' },
    ]},
    { section: 'System', items: [
      { to: '/admin/sites', icon: '📍', label: 'Site Management' },
      { to: '/admin/users/bulk', icon: '👥', label: 'Bulk User Upload' },
    ]},
  ],
  trainer: [
    { section: 'My Work', items: [
      { to: '/trainer/dashboard', icon: '📊', label: 'My Dashboard' },
      { to: '/trainer/sessions', icon: '🏫', label: 'My Sessions' },
      { to: '/admin/calendar', icon: '📅', label: 'Calendar' },
      { to: '/sessions/classroom/new', icon: '➕', label: 'New Session' },
    ]},
    { section: 'Content', items: [
      { to: '/courses/new', icon: '🏗️', label: 'Course Builder' },
      { to: '/content/upload', icon: '📁', label: 'Content Hub' },
      { to: '/questions/manage', icon: '❓', label: 'Question Bank' },
    ]},
    { section: 'Assessments', items: [
      { to: '/assessments', icon: '📝', label: 'Assessments' },
      { to: '/sessions/quiz-results', icon: '📋', label: 'Quiz Results' },
      { to: '/sessions/evaluate', icon: '⭐', label: 'Session Feedback' },
    ]},
  ],
  trainee: [
    { section: 'Overview', items: [
      { to: '/trainee/dashboard', icon: '🏠', label: 'My Dashboard' },
    ]},
    { section: 'Learning', items: [
      { to: '/trainee/my-training', icon: '📜', label: 'My Training History' },
      { to: '/trainee/assessments', icon: '📝', label: 'Take Assessment' },
      { to: '/trainee/certificates', icon: '🎓', label: 'My Certificates' },
      { to: '/admin/calendar', icon: '📅', label: 'Session Calendar' },
    ]},
    { section: 'Feedback', items: [
      { to: '/sessions/evaluate', icon: '⭐', label: 'Rate a Session' },
    ]},
  ],
}

const ROLE_BADGE = {
  superadmin: { style: { background: 'rgba(239,68,68,0.2)', color: '#ef4444' }, label: 'Super Admin' },
  admin:      { style: { background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }, label: 'Admin' },
  trainer:    { style: { background: 'rgba(34,197,94,0.2)', color: '#22c55e' }, label: 'Trainer' },
  trainee:    { style: { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }, label: 'Trainee' },
}

export default function AppLayout({ children }) {
  const { user, logout, loginAs } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchRole = (account) => {
    loginAs(account);
    setAccountOpen(false);
    const redirect = { superadmin: '/admin/dashboard', admin: '/admin/dashboard', trainer: '/trainer/dashboard', trainee: '/trainee/dashboard' };
    navigate(redirect[account.role] || '/admin/dashboard');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAccountOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || '?'
    : '?';

  const role = user?.role || 'admin';
  const roleBadge = ROLE_BADGE[role] || ROLE_BADGE.admin;
  const navSections = SIDEBAR_NAV[role] || SIDEBAR_NAV.admin;

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">L</div>
          <div>
            <span className="sidebar-logo-text">LearnSphere</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>LMS Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav custom-scrollbar">
          {navSections.map(section => (
            <React.Fragment key={section.section}>
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} className="sidebar-link" onClick={() => setSidebarOpen(false)}>
                  <span>{item.icon}</span> {item.label}
                  {item.superOnly && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>SA</span>
                  )}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Sidebar Footer — User Card */}
        <div className="sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <span style={{ ...roleBadge.style, fontSize: '0.68rem', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        {/* Top Header */}
        <header className="app-topheader">
          <div className="topheader-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          </div>

          <div className="topheader-center">
            <div className="search-input-wrapper">
              <span className="search-input-icon">🔍</span>
              <input type="text" placeholder="Search employees, courses, sessions..." />
            </div>
          </div>

          <div className="topheader-right">
            <button className="header-icon-btn" title="Notifications">
              🔔
              <span className="notification-badge"></span>
            </button>

            {/* Account Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setAccountOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border-color)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                  {initials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{user?.first_name}</div>
                  <div style={{ ...roleBadge.style, fontSize: '0.65rem', padding: '1px 5px', borderRadius: 999, fontWeight: 700, display: 'inline-block' }}>
                    {roleBadge.label}
                  </div>
                </div>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>
                  <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>
              </button>

              {accountOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 280, zIndex: 200,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14,
                  boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
                }}>
                  {/* Current user */}
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Signed in as</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{user?.first_name} {user?.last_name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Switch Role */}
                  <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Switch Demo Account</div>
                    {DEMO_ACCOUNTS.filter(a => a.role !== user?.role).map(account => (
                      <button
                        key={account.role}
                        onClick={() => handleSwitchRole(account)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 10px', borderRadius: 8, background: 'none',
                          border: 'none', cursor: 'pointer', marginBottom: 4, textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{account.avatar}</span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{account.first_name} {account.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{account.roleLabel}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div style={{ padding: '8px 14px' }}>
                    <button
                      onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', fontWeight: 700, fontSize: '0.9rem', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="app-content custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
