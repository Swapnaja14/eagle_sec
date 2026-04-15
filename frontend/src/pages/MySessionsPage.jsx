import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ALL_SESSIONS = [
  { id: 1, topic: 'PSARA Foundation Course', type: 'classroom', date: '2026-04-15', time: '2:00 PM', site: 'Mumbai HQ', enrolled: 45, attended: null, status: 'upcoming', passPct: null },
  { id: 2, topic: 'Fire Safety & Evacuation', type: 'classroom', date: '2026-04-16', time: '9:00 AM', site: 'Pune Campus', enrolled: 20, attended: null, status: 'upcoming', passPct: null },
  { id: 3, topic: 'Emergency Response Protocol', type: 'virtual', date: '2026-04-16', time: '11:00 AM', site: 'Online', enrolled: 30, attended: null, status: 'upcoming', passPct: null },
  { id: 4, topic: 'CCTV Operations Mastery', type: 'classroom', date: '2026-04-10', time: '9:00 AM', site: 'Delhi Office', enrolled: 25, attended: 24, status: 'completed', passPct: 88 },
  { id: 5, topic: 'Access Control Procedures', type: 'virtual', date: '2026-04-07', time: '2:00 PM', site: 'Online', enrolled: 38, attended: 35, status: 'completed', passPct: 77 },
  { id: 6, topic: 'Customer Service Excellence', type: 'classroom', date: '2026-03-28', time: '10:00 AM', site: 'Bangalore Tech Park', enrolled: 50, attended: 48, status: 'completed', passPct: 92 },
  { id: 7, topic: 'First Aid & CPR Certification', type: 'classroom', date: '2026-03-21', time: '9:00 AM', site: 'Hyderabad Zone', enrolled: 30, attended: 28, status: 'completed', passPct: 85 },
  { id: 8, topic: 'Digital Security Awareness', type: 'virtual', date: '2026-03-15', time: '3:00 PM', site: 'Online', enrolled: 60, attended: 55, status: 'completed', passPct: 80 },
];

export default function MySessionsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = ALL_SESSIONS.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  const upcoming = ALL_SESSIONS.filter(s => s.status === 'upcoming').length;
  const completed = ALL_SESSIONS.filter(s => s.status === 'completed').length;

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
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Upcoming', value: upcoming, color: 'var(--accent-blue)' },
          { label: 'Completed', value: completed, color: 'var(--accent-green)' },
          { label: 'Total', value: ALL_SESSIONS.length, color: 'var(--text-primary)' },
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
