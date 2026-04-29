import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { assessmentsAPI, trainingHistoryAPI } from '../services/api';

export default function MyTrainingHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get comprehensive history first
      let data = [];
      try {
        const res = await trainingHistoryAPI.myHistory({ limit: 200 });
        data = res.data.results || [];
      } catch (e) {
        console.log('Failed to fetch from trainingHistoryAPI, falling back to assessmentsAPI');
        const res = await assessmentsAPI.mySubmissions();
        data = res.data || [];
      }

      // Map backend data to display format
      const mapped = data.map((item) => ({
        id: item.id,
        module: item.quiz_title || item.module || `Quiz #${item.quiz}`,
        type: item.type || 'assessment',
        date: item.submitted_at || item.started_at || item.date,
        trainer: item.trainer || '—',
        duration: item.time_taken_seconds ? Math.round(item.time_taken_seconds / 60) : (item.duration_minutes || null),
        score: item.status === 'completed' || item.status === 'passed' ? Math.round(item.percentage || item.score || 0) : null,
        status: item.passed || item.status === 'passed' ? 'passed' : (item.status === 'in_progress' || item.status === 'in-progress' ? 'in-progress' : 'failed'),
        certId: item.cert_id || (item.passed ? `LS-${item.quiz}-${item.id}` : null),
        attempt: item.attempt_number || 1,
      }));
      setRecords(mapped);
    } catch (err) {
      console.error('Failed to load training history:', err);
      setError('Unable to load training history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.module.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const passed = records.filter(r => r.status === 'passed').length;
  
  const avgScore = useMemo(() => {
    const scoredItems = records.filter(r => r.score !== null && r.score !== undefined);
    if (scoredItems.length === 0) return 0;
    return Math.round(scoredItems.reduce((s, r) => s + r.score, 0) / scoredItems.length);
  }, [records]);

  const totalHours = useMemo(() => {
    const totalMins = records.reduce((s, r) => s + (r.duration || 0), 0);
    return Math.round(totalMins / 60 * 10) / 10;
  }, [records]);

  // ── Loading State ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading training history…</p>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
        <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: 12 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadHistory}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Training History</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          All assessments and training sessions — {user?.first_name} {user?.last_name} • {user?.username}
        </p>
      </div>

      {/* Personal Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Modules', value: records.length, color: 'var(--accent-blue)', icon: '📚' },
          { label: 'Passed', value: `${passed}/${records.length}`, color: 'var(--accent-green)', icon: '✅' },
          { label: 'Avg Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', icon: '📊' },
          { label: 'Total Time Spent', value: `${totalHours}h`, color: 'var(--accent-cyan)', icon: '⏱️' },
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
                <th>Date</th>
                <th>Type</th>
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
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {r.type === 'virtual' ? '💻' : r.type === 'classroom' ? '🏫' : '📝'} {r.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {r.duration !== null ? (r.duration >= 60 ? `${Math.round(r.duration / 60 * 10) / 10}h` : `${r.duration}m`) : '—'}
                  </td>
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
                      <button className="btn btn-ghost btn-sm" onClick={() => alert(`Certificate: ${r.certId}`)}>🎓 Download</button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filtered.length} of {records.length} records
        </div>
      </div>
    </div>
  );
}
