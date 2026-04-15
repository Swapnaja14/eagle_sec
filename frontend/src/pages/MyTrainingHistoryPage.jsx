import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTrainingModules } from '../data/mockData';

const MY_RECORDS = [
  { id: 1, module: 'PSARA Foundation Course', type: 'classroom', date: '2026-03-20', trainer: 'Rajesh Kumar', duration: 120, score: 88, status: 'passed', certId: 'LS-PSARA-2026-0042' },
  { id: 2, module: 'Fire Safety & Evacuation', type: 'classroom', date: '2026-02-14', trainer: 'Priya Sharma', duration: 60, score: 92, status: 'passed', certId: 'LS-FIRE-2026-0018' },
  { id: 3, module: 'Emergency Response Protocol', type: 'virtual', date: '2026-01-30', trainer: 'Amit Patel', duration: 90, score: 74, status: 'passed', certId: 'LS-ERP-2025-0091' },
  { id: 4, module: 'Access Control Procedures', type: 'virtual', date: '2026-04-10', trainer: 'Sunita Rao', duration: 120, score: null, status: 'in-progress', certId: null },
  { id: 5, module: 'Customer Service Excellence', type: 'classroom', date: '2025-11-05', trainer: 'Rajesh Kumar', duration: 240, score: 65, status: 'passed', certId: null },
  { id: 6, module: 'First Aid & CPR Certification', type: 'classroom', date: '2025-09-12', trainer: 'Priya Sharma', duration: 480, score: 55, status: 'failed', certId: null },
];

export default function MyTrainingHistoryPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = MY_RECORDS.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passed = MY_RECORDS.filter(r => r.status === 'passed').length;
  const avgScore = Math.round(MY_RECORDS.filter(r => r.score).reduce((s, r) => s + r.score, 0) / MY_RECORDS.filter(r => r.score).length);
  const totalHours = Math.round(MY_RECORDS.reduce((s, r) => s + r.duration, 0) / 60);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Training History</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          All training sessions you have attended — {user?.first_name} {user?.last_name} • {user?.employeeId || 'EMP-10042'}
        </p>
      </div>

      {/* Personal Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Modules Attended', value: MY_RECORDS.length, color: 'var(--accent-blue)', icon: '📚' },
          { label: 'Passed', value: `${passed}/${MY_RECORDS.length}`, color: 'var(--accent-green)', icon: '✅' },
          { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', icon: '📊' },
          { label: 'Total Training Hours', value: `${totalHours}h`, color: 'var(--accent-cyan)', icon: '⏱️' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.4rem' }}>{kpi.icon}</span>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by module..." style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'passed', 'failed', 'in-progress'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Module</th>
                <th>Type</th>
                <th>Date</th>
                <th>Trainer</th>
                <th>Duration</th>
                <th>Score</th>
                <th>Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.module}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {r.type === 'virtual' ? '💻' : '🏫'} {r.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.trainer}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.duration >= 60 ? `${r.duration / 60}h` : `${r.duration}m`}</td>
                  <td>
                    {r.score !== null ? (
                      <span style={{ fontWeight: 800, color: r.score >= 80 ? 'var(--accent-green)' : r.score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                        {r.score}%
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'passed' ? 'badge-active' : r.status === 'failed' ? 'badge-retired' : 'badge-draft'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.certId ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => alert(`Downloading: ${r.certId}`)}>🎓 Download</button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filtered.length} of {MY_RECORDS.length} records
        </div>
      </div>
    </div>
  );
}
