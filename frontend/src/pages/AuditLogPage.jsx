import React, { useState } from 'react';

const ACTION_TYPES = ['all', 'login', 'logout', 'rbac_change', 'user_created', 'session_created', 'course_published', 'export_generated', 'cert_downloaded'];

const MOCK_LOGS = [
  { id: 1, timestamp: '2026-04-15 07:43:22', actor: 'Suresh Iyer (superadmin)', action: 'rbac_change', details: 'REVOKED Analytics Reports access from Admin role', ip: '192.168.1.12', severity: 'high' },
  { id: 2, timestamp: '2026-04-15 07:40:11', actor: 'Anita Sharma (admin)', action: 'session_created', details: 'Scheduled Classroom Session: PSARA Foundation Course @ Mumbai HQ', ip: '10.0.0.5', severity: 'low' },
  { id: 3, timestamp: '2026-04-15 07:35:04', actor: 'Rajesh Kumar (trainer)', action: 'course_published', details: 'Published course: Fire Safety & Evacuation Module v2', ip: '10.0.0.8', severity: 'medium' },
  { id: 4, timestamp: '2026-04-15 07:30:00', actor: 'Priya Mehta (trainee)', action: 'login', details: 'Successful login from Chrome/Windows', ip: '203.145.88.12', severity: 'low' },
  { id: 5, timestamp: '2026-04-15 07:28:45', actor: 'Anita Sharma (admin)', action: 'export_generated', details: 'Generated PSARA Compliance Report (PDF) — Scope: All Clients', ip: '10.0.0.5', severity: 'medium' },
  { id: 6, timestamp: '2026-04-15 07:15:33', actor: 'Suresh Iyer (superadmin)', action: 'user_created', details: 'Bulk uploaded 47 users from employee_batch_april.csv', ip: '192.168.1.12', severity: 'medium' },
  { id: 7, timestamp: '2026-04-14 23:10:00', actor: 'Priya Mehta (trainee)', action: 'cert_downloaded', details: 'Downloaded Certificate: LS-PSARA-2026-0042', ip: '203.145.88.12', severity: 'low' },
  { id: 8, timestamp: '2026-04-14 18:55:00', actor: 'Suresh Iyer (superadmin)', action: 'rbac_change', details: 'GRANTED Course Builder access to Trainer role', ip: '192.168.1.12', severity: 'high' },
  { id: 9, timestamp: '2026-04-14 17:00:00', actor: 'System', action: 'login', details: 'Failed login attempt: username=hacker123 (5 consecutive failures — IP blocked)', ip: '45.22.101.200', severity: 'high' },
  { id: 10, timestamp: '2026-04-14 14:32:10', actor: 'Suresh Iyer (superadmin)', action: 'rbac_change', details: 'REVOKED RBAC Management from Admin role', ip: '192.168.1.12', severity: 'high' },
];

const SEVERITY_STYLE = {
  high: { background: 'rgba(239,68,68,0.12)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' },
  medium: { background: 'rgba(245,158,11,0.12)', color: 'var(--accent-yellow)', border: '1px solid rgba(245,158,11,0.3)' },
  low: { background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.3)' },
};

const ACTION_ICONS = { login: '🔑', logout: '🚪', rbac_change: '🔐', user_created: '👤', session_created: '🏫', course_published: '📚', export_generated: '📦', cert_downloaded: '🎓' };

export default function AuditLogPage() {
  const [filter, setFilter] = useState({ action: 'all', severity: 'all', search: '' });

  const filtered = MOCK_LOGS.filter(log => {
    if (filter.action !== 'all' && log.action !== filter.action) return false;
    if (filter.severity !== 'all' && log.severity !== filter.severity) return false;
    if (filter.search && !log.actor.toLowerCase().includes(filter.search.toLowerCase()) &&
        !log.details.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Audit Logs</h1>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>SUPER ADMIN ONLY</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Immutable log of all user actions and system events.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => alert('Export (mock)')}>📥 Export Logs</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Events', value: MOCK_LOGS.length, color: 'var(--accent-blue)' },
          { label: 'High Severity', value: MOCK_LOGS.filter(l => l.severity === 'high').length, color: 'var(--accent-red)' },
          { label: 'Today', value: MOCK_LOGS.filter(l => l.timestamp.startsWith('2026-04-15')).length, color: 'var(--accent-cyan)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
          <label className="form-label">Search</label>
          <input className="form-input" value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))} placeholder="Actor name or event details..." />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
          <label className="form-label">Action Type</label>
          <select className="form-select" value={filter.action} onChange={e => setFilter(p => ({ ...p, action: e.target.value }))}>
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
          <label className="form-label">Severity</label>
          <select className="form-select" value={filter.severity} onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))}>
            <option value="all">All Severities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>{filtered.length} events</span>
          <span>Showing all time • Sorted by newest</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{log.actor}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {ACTION_ICONS[log.action] || '🔔'} {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 400 }}>{log.details}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.ip}</td>
                  <td>
                    <span style={{ ...SEVERITY_STYLE[log.severity], padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
