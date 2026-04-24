import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../services/api';

export default function MySessionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ count: 0, upcoming_count: 0, completed_count: 0 });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await sessionsAPI.getMySessions();
        setSessions(response.data?.results || []);
        setStats({
          count: response.data?.count || 0,
          upcoming_count: response.data?.upcoming_count || 0,
          completed_count: response.data?.completed_count || 0,
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch trainer sessions:', err);
        setError('Failed to load sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filtered = Array.isArray(sessions) ? sessions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  }) : [];

  const upcoming = stats.upcoming_count;
  const completed = stats.completed_count;
  const total = stats.count;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Sessions</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All training sessions assigned to you — upcoming and completed.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sessions/classroom/new')}>+ New Session</button>
      </div>

      {/* Stats row */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '14px 22px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Loading sessions...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '14px 22px', marginBottom: 24, color: 'var(--accent-red)' }}>
          {error}
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 12 }} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Upcoming', value: upcoming, color: 'var(--accent-blue)' },
            { label: 'Completed', value: completed, color: 'var(--accent-green)' },
            { label: 'Total', value: total, color: 'var(--text-primary)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'upcoming', 'completed'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'classroom', 'virtual'].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Types' : t === 'classroom' ? '🏫 Classroom' : '💻 Virtual'}
            </button>
          ))}
        </div>
      </div>

      {/* Session Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(session => (
          <div key={session.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: session.type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
              color: session.type === 'virtual' ? '#a855f7' : 'var(--accent-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
            }}>
              {session.type === 'virtual' ? '💻' : '🏫'}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>{session.topic}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                📅 {session.date} at {session.time} &nbsp;|&nbsp; 📍 {session.site}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '1.2rem' }}>{session.enrolled}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enrolled</div>
              </div>
              {session.status === 'completed' && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '1.2rem' }}>{session.attended}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Attended</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: session.passPct >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{session.passPct}%</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pass Rate</div>
                  </div>
                </>
              )}
            </div>

            <span className={`badge ${session.status === 'upcoming' ? 'badge-draft' : 'badge-active'}`} style={{ flexShrink: 0 }}>
              {session.status}
            </span>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm">👁️ View</button>
              {session.status === 'upcoming' && <button className="btn btn-ghost btn-sm">✏️ Edit</button>}
              {session.status === 'completed' && <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sessions/quiz-results')}>📊 Results</button>}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
            <p style={{ color: 'var(--text-muted)' }}>No sessions match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
