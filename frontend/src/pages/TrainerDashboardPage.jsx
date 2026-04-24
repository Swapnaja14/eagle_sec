import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem' };

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.trainerDashboard();
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch trainer dashboard:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: 'var(--accent-red)', marginBottom: 16 }}>{error}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // Use real data or fallback to empty arrays
  const upcoming = data?.upcoming_sessions || [];
  const completed = data?.completed_sessions || [];
  const totalTrained = data?.total_trained || 0;
  const avgRating = data?.average_rating?.toFixed(1) || '0.0';
  const sessionTrend = data?.session_trend || [];
  const scoreTrend = data?.score_trend || [];
  const feedback = data?.feedback || [];

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 28, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Welcome back, Trainer</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {user?.first_name} {user?.last_name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You have <strong style={{ color: 'var(--accent-blue)' }}>{upcoming.length} upcoming sessions</strong> this week.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/sessions/classroom/new')}>
          + Schedule New Session
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Sessions This Month', value: data?.current_month_sessions || 0, icon: '🏫', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Trainees Trained', value: totalTrained, icon: '👥', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Avg Trainee Score', value: `${scoreTrend.length > 0 ? scoreTrend[scoreTrend.length - 1].avg : 0}%`, icon: '📊', color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.12)' },
          { label: 'My Avg Rating', value: `${avgRating} ★`, icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
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
          {upcoming.map(session => (
            <div key={session.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, background: session.type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: session.type === 'virtual' ? '#a855f7' : 'var(--accent-blue)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                {session.type === 'virtual' ? '💻' : '🏫'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{session.topic}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{session.date} • {session.site}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: '1.1rem' }}>{session.enrolled}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>enrolled</div>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No upcoming sessions.</p>}
        </div>

        {/* Feedback Ratings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Session Feedback</h3>
            {feedback.length > 0 ? feedback.map((f, idx) => (
              <div key={idx} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{f.session}</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>{f.rating} ★</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: `${(f.rating / 5) * 100}%`, background: '#f59e0b', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.responses} responses {f.trend}</div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>No feedback received yet.</p>
            )}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Avg Trainee Score Trend</h3>
            <div style={{ height: 120 }}>
              <ResponsiveContainer>
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <XAxis dataKey="month" stroke="#8b949e" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} domain={[60, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="avg" name="Avg Score %" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Session Volume Chart */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>My Sessions Per Month</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={sessionTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis dataKey="month" stroke="#8b949e" />
              <YAxis stroke="#8b949e" allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
