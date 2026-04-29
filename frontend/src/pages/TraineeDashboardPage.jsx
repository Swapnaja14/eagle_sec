import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

export default function TraineeDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardAPI.getTraineeOverview();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load trainee dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading your dashboard…</p>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
        <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: 12 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard}>Retry</button>
      </div>
    );
  }

  const myTraining = data?.my_training || [];
  const upcomingSessions = data?.upcoming_sessions || [];
  const pendingAssessments = data?.pending_assessments || [];
  const serverUser = data?.user || {};

  const displayName = serverUser.first_name || user?.first_name || 'Trainee';
  const passed = myTraining.filter(t => t.status === 'passed').length;
  const total = myTraining.length;
  const scoredItems = myTraining.filter(t => t.score !== null && t.score !== undefined);
  const avgScore = scoredItems.length
    ? Math.round(scoredItems.reduce((s, t) => s + t.score, 0) / scoredItems.length)
    : 0;
  const certs = myTraining.filter(t => t.certificateReady).length;

  // PSARA expiry — user profile field or fallback 22 days mock
  const psaraExpiry = new Date(user?.psaraExpiry || Date.now() + 22 * 86400000);
  const daysLeft = Math.max(0, Math.ceil((psaraExpiry - Date.now()) / 86400000));
  const psaraUrgent = daysLeft <= 30;

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Hero / Welcome ───────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        border: '1px solid var(--border-color)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>🏠 My Learning Portal</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            {getHour()}, {displayName}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            You have{' '}
            <strong style={{ color: 'var(--accent-yellow)' }}>{pendingAssessments.length} pending assessments</strong>
            {' '}and{' '}
            <strong style={{ color: 'var(--accent-blue)' }}>{upcomingSessions.length} upcoming sessions</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={() => navigate('/trainee/assessments')}>Take Assessment</button>
          <button className="btn btn-secondary" onClick={() => navigate('/trainee/certificates')}>My Certificates</button>
        </div>
      </div>

      {/* ── PSARA Alert ──────────────────────────────────────────────────── */}
      {psaraUrgent && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-yellow)', fontSize: '0.95rem' }}>
              PSARA Certification Expiring Soon!
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Your PSARA certificate expires in{' '}
              <strong style={{ color: 'var(--accent-yellow)' }}>{daysLeft} days</strong>{' '}
              ({psaraExpiry.toLocaleDateString()}). Contact your admin for renewal.
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Modules Completed', value: `${passed}/${total}`, color: 'var(--accent-green)', icon: '✅', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Avg Assessment Score', value: `${avgScore}%`, color: avgScore >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)', icon: '📊', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Certificates Earned', value: certs, color: 'var(--accent-cyan)', icon: '🎓', bg: 'rgba(6,182,212,0.12)' },
          { label: 'PSARA Days Remaining', value: daysLeft, color: daysLeft > 30 ? 'var(--accent-green)' : daysLeft > 0 ? 'var(--accent-yellow)' : 'var(--accent-red)', icon: '🛡️', bg: 'rgba(245,158,11,0.12)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, background: kpi.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 12 }}>
              {kpi.icon}
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid: Pending Assessments + Upcoming Sessions ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Pending Assessments */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>📝 Pending Assessments</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trainee/assessments')}>View All</button>
          </div>
          {pendingAssessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎉</div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No pending assessments. You're all caught up!</p>
            </div>
          ) : pendingAssessments.map(a => (
            <div key={a.id} style={{ padding: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{a.module}</div>
                {a.deadline && a.deadline !== 'N/A' && (
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                    Due {a.deadline}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {a.questions} questions • {a.timeLimit} min time limit
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/trainee/assessments', { state: { quizId: a.id } })}
              >
                Start Assessment →
              </button>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text-primary)' }}>📅 Upcoming Sessions</h3>
          {upcomingSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No upcoming sessions scheduled.</p>
            </div>
          ) : upcomingSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 14, padding: '14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, flexShrink: 0,
                background: s.type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                color: s.type === 'virtual' ? '#a855f7' : 'var(--accent-blue)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
              }}>
                {s.type === 'virtual' ? '💻' : '🏫'}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{s.module}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📅 {s.date}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 {s.venue}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Training History ───────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>My Recent Training</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/trainee/my-training')}>View All</button>
        </div>

        {myTraining.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No training records yet. Start an assessment to begin!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {myTraining.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.module}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {t.score !== null && t.score !== undefined ? (
                        <span style={{ fontWeight: 800, color: t.score >= 80 ? 'var(--accent-green)' : t.score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>
                          {t.score}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>In Progress</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'passed' ? 'badge-active' : t.status === 'in-progress' ? 'badge-draft' : 'badge-retired'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.certificateReady ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trainee/certificates')}>
                          🎓 Download
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
