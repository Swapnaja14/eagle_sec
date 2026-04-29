import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI, feedbackAPI } from '../services/api';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem' };

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions,     setSessions]     = useState([]);
  const [feedback,     setFeedback]     = useState([]);
  const [trend,        setTrend]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sessRes, fbRes, trendRes] = await Promise.all([
          sessionsAPI.list(),
          feedbackAPI.list({ trainer: user?.id }),
          api.get('/dashboard/training-trend/', { params: { from: sixMonthsAgo(), to: today() } }),
        ]);
        setSessions(sessRes.data?.results ?? sessRes.data ?? []);
        setFeedback(fbRes.data?.results ?? fbRes.data ?? []);
        setTrend(trendRes.data ?? []);
      } catch { /* silent — show empty state */ }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  const upcoming  = sessions.filter(s => ['scheduled','draft'].includes(s.status?.toLowerCase()));
  const completed = sessions.filter(s => s.status?.toLowerCase() === 'completed');
  const totalTrained = completed.reduce((s, x) => s + (x.attendee_count ?? 0), 0);

  // Avg feedback rating
  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / feedback.length).toFixed(1)
    : '—';

  // Latest avg score from trend
  const latestScore = trend.length > 0
    ? Math.round((trend[trend.length - 1].completed / Math.max(trend[trend.length - 1].enrolled, 1)) * 100)
    : 0;

  // Session volume per month from trend
  const sessionTrend = trend.map(t => ({ month: t.month, sessions: t.enrolled ?? 0 }));

  // Score trend (completion % per month)
  const scoreTrend = trend.map(t => ({
    month: t.month,
    avg: t.enrolled > 0 ? Math.round((t.completed / t.enrolled) * 100) : 0,
  }));

  // Feedback grouped by session
  const feedbackBySess = feedback.reduce((acc, f) => {
    const key = f.session_topic ?? `Session #${f.session}`;
    if (!acc[key]) acc[key] = { ratings: [], count: 0 };
    acc[key].ratings.push(f.rating ?? 0);
    acc[key].count++;
    return acc;
  }, {});
  const feedbackRows = Object.entries(feedbackBySess).slice(0, 4).map(([sess, d]) => ({
    session: sess,
    rating: (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1),
    responses: d.count,
  }));

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 28, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Welcome back, Trainer</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {user?.first_name} {user?.last_name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            You have <strong style={{ color: 'var(--accent-blue)' }}>{upcoming.length} upcoming session{upcoming.length !== 1 ? 's' : ''}</strong>.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/sessions/classroom/new')}>
          + Schedule New Session
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Sessions',    value: loading ? '—' : sessions.length,  icon: '🏫', color: 'var(--accent-blue)',  bg: 'rgba(59,130,246,0.12)' },
          { label: 'Trainees Trained',  value: loading ? '—' : totalTrained,     icon: '👥', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Completion Rate',   value: loading ? '—' : `${latestScore}%`,icon: '📊', color: 'var(--accent-cyan)',  bg: 'rgba(6,182,212,0.12)' },
          { label: 'My Avg Rating',     value: loading ? '—' : `${avgRating} ★`, icon: '⭐', color: '#f59e0b',            bg: 'rgba(245,158,11,0.12)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '1.5rem', padding: 8, background: kpi.bg, borderRadius: 10, lineHeight: 1 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Upcoming Sessions */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Sessions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/trainer/sessions')}>View All</button>
          </div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
          ) : upcoming.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No upcoming sessions.</p>
          ) : upcoming.slice(0, 5).map(session => {
            const dt = session.date_time ? new Date(session.date_time).toLocaleString() : '—';
            return (
              <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, background: session.session_type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: session.session_type === 'virtual' ? '#a855f7' : 'var(--accent-blue)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {session.session_type === 'virtual' ? '💻' : '🏫'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{session.topic}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dt} • {session.venue || session.site || 'TBD'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '1.1rem' }}>{session.attendee_count ?? 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>enrolled</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback + Score Trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Session Feedback</h3>
            {loading ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</p>
              : feedbackRows.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No feedback yet.</p>
              : feedbackRows.map(f => (
                <div key={f.session} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{f.session}</span>
                    <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>{f.rating} ★</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${(parseFloat(f.rating) / 5) * 100}%`, background: '#f59e0b', borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.responses} response{f.responses !== 1 ? 's' : ''}</div>
                </div>
              ))}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Completion Rate Trend</h3>
            <div style={{ height: 120 }}>
              <ResponsiveContainer>
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <XAxis dataKey="month" stroke="#8b949e" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="avg" name="Completion %" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Session Volume Chart */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Training Enrollment Trend</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={sessionTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="month" stroke="#8b949e" />
              <YAxis stroke="#8b949e" allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="sessions" name="Enrolled" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function today() { return new Date().toISOString().slice(0, 10); }
function sixMonthsAgo() { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0, 10); }
