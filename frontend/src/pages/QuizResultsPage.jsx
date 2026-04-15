import React, { useState } from 'react';
import { mockTrainingRecords, mockTrainers, mockTrainingModules } from '../data/mockData';

const mockQuizResults = Array.from({ length: 20 }, (_, i) => {
  const record = mockTrainingRecords[i % mockTrainingRecords.length];
  const passed = record.score !== null && record.score >= 70;
  return {
    id: `QR-${i + 1}`,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    department: record.department,
    sessionName: mockTrainingModules[i % mockTrainingModules.length],
    sessionDate: record.sessionDate,
    score: record.score ?? Math.floor(Math.random() * 40) + 50,
    totalQuestions: 20,
    correct: record.score ? Math.round((record.score / 100) * 20) : 10,
    timeTaken: `${Math.floor(Math.random() * 30) + 15} min`,
    status: record.status === 'passed' ? 'passed' : record.status === 'failed' ? 'failed' : passed ? 'passed' : 'failed',
    attempts: Math.random() > 0.7 ? 2 : 1,
  };
});

export default function QuizResultsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('');

  const filtered = mockQuizResults.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (sessionFilter && r.sessionName !== sessionFilter) return false;
    if (search && !r.employeeName.toLowerCase().includes(search.toLowerCase()) &&
        !r.employeeId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passed = filtered.filter(r => r.status === 'passed').length;
  const failed = filtered.filter(r => r.status === 'failed').length;
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length) : 0;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Quiz Results Summary</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Per-trainee assessment scores, pass/fail breakdown, and retry management.</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Attempts', value: filtered.length, color: 'var(--accent-blue)' },
          { label: 'Passed', value: passed, color: 'var(--accent-green)' },
          { label: 'Failed', value: failed, color: 'var(--accent-red)' },
          { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'var(--accent-green)' : avgScore >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Search Employee</label>
            <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or Employee ID..." />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Session</label>
            <select className="form-select" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)}>
              <option value="">All Sessions</option>
              {mockTrainingModules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filtered.length} results
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Session</th>
                <th>Date</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Time Taken</th>
                <th>Attempts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.employeeName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.employeeId}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.department}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sessionName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.sessionDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      fontWeight: 800, fontSize: '1rem',
                      color: r.score >= 80 ? 'var(--accent-green)' : r.score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)'
                    }}>{r.score}%</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.correct}/{r.totalQuestions}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.timeTaken}</td>
                  <td style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{r.attempts}</td>
                  <td>
                    <span className={`badge ${r.status === 'passed' ? 'badge-active' : 'badge-retired'}`}>{r.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="View Details">👁️</button>
                      {r.status === 'failed' && <button className="btn btn-secondary btn-sm">Retry</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
