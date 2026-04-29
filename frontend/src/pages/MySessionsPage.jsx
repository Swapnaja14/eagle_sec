import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../services/api';

export default function MySessionsPage() {
  const navigate = useNavigate();
  const [sessions,      setSessions]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [typeFilter,    setTypeFilter]    = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await sessionsAPI.list();
        const data = res.data?.results ?? res.data ?? [];
        setSessions(data);
      } catch (e) {
        setError('Failed to load sessions: ' + (e.response?.data?.detail ?? e.message));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await sessionsAPI.remove(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { alert('Failed to delete session.'); }
  };

  const filtered = sessions.filter(s => {
    const status = s.status?.toLowerCase();
    const type   = s.session_type?.toLowerCase();
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (typeFilter   !== 'all' && type   !== typeFilter)   return false;
    return true;
  });

  const upcoming  = sessions.filter(s => ['scheduled','draft'].includes(s.status?.toLowerCase())).length;
  const completed = sessions.filter(s => s.status?.toLowerCase() === 'completed').length;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Sessions</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All training sessions — upcoming and completed.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sessions/classroom/new')}>+ New Session</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Upcoming',  value: loading ? '—' : upcoming,          color: 'var(--accent-blue)' },
          { label: 'Completed', value: loading ? '—' : completed,         color: 'var(--accent-green)' },
          { label: 'Total',     value: loading ? '—' : sessions.length,   color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'classroom', 'virtual'].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Types' : t === 'classroom' ? '🏫 Classroom' : '💻 Virtual'}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--accent-red)', marginBottom: 16 }}>{error}</div>}

      {/* Session Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading sessions...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(session => {
            const isUpcoming = ['scheduled', 'draft'].includes(session.status?.toLowerCase());
            const isCompleted = session.status?.toLowerCase() === 'completed';
            const dt = session.date_time ? new Date(session.date_time) : null;
            const trainerName = session.trainer_name || session.trainer?.username || '—';

            return (
              <div key={session.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: session.session_type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                  color: session.session_type === 'virtual' ? '#a855f7' : 'var(--accent-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>
                  {session.session_type === 'virtual' ? '💻' : '🏫'}
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 4 }}>{session.topic}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    📅 {dt ? dt.toLocaleString() : '—'} &nbsp;|&nbsp;
                    📍 {session.venue || session.site || 'TBD'} &nbsp;|&nbsp;
                    👤 {trainerName}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '1.2rem' }}>{session.attendee_count ?? 0}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enrolled</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{session.max_participants ?? '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Capacity</div>
                  </div>
                </div>

                <span className={`badge ${isUpcoming ? 'badge-draft' : isCompleted ? 'badge-active' : 'badge-retired'}`} style={{ flexShrink: 0 }}>
                  {session.status}
                </span>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/sessions/classroom/new`, { state: { session } })}>
                    👁️ View
                  </button>
                  {isUpcoming && (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/sessions/classroom/new`, { state: { session, editing: true } })}>
                      ✏️ Edit
                    </button>
                  )}
                  {isCompleted && (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate('/sessions/quiz-results')}>
                      📊 Results
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }}
                    onClick={() => handleDelete(session.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
              <p style={{ color: 'var(--text-muted)' }}>No sessions found. Create your first session!</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/sessions/classroom/new')}>
                + Schedule Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
