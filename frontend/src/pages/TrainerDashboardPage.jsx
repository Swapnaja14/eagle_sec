import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trainersAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TOOLTIP_STYLE = { backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem' };

const MY_SESSIONS = [
  { id: 1, topic: 'PSARA Foundation Course', type: 'classroom', date: 'Today, 2:00 PM', site: 'Mumbai HQ', enrolled: 45, attended: 0, status: 'upcoming' },
  { id: 2, topic: 'Fire Safety & Evacuation', type: 'classroom', date: 'Tomorrow, 9:00 AM', site: 'Pune Campus', enrolled: 20, attended: 0, status: 'upcoming' },
  { id: 3, topic: 'Emergency Response Protocol', type: 'virtual', date: 'Apr 16, 11:00 AM', site: 'Online', enrolled: 30, attended: 0, status: 'upcoming' },
  { id: 4, topic: 'CCTV Operations Mastery', type: 'classroom', date: 'Apr 10, 9:00 AM', site: 'Delhi Office', enrolled: 25, attended: 24, status: 'completed' },
  { id: 5, topic: 'Access Control Procedures', type: 'virtual', date: 'Apr 7, 2:00 PM', site: 'Online', enrolled: 38, attended: 35, status: 'completed' },
];

const SCORE_TREND = [
  { month: 'Nov', avg: 74 }, { month: 'Dec', avg: 79 }, { month: 'Jan', avg: 81 },
  { month: 'Feb', avg: 83 }, { month: 'Mar', avg: 87 }, { month: 'Apr', avg: 88 },
];

const SESSION_TREND = [
  { month: 'Nov', sessions: 4 }, { month: 'Dec', sessions: 5 }, { month: 'Jan', sessions: 6 },
  { month: 'Feb', sessions: 5 }, { month: 'Mar', sessions: 7 }, { month: 'Apr', sessions: 5 },
];

const MY_FEEDBACK = [
  { session: 'PSARA Foundation Course', rating: 4.7, responses: 41, trend: '↑' },
  { session: 'Fire Safety & Evacuation', rating: 4.4, responses: 19, trend: '→' },
  { session: 'CCTV Operations', rating: 4.9, responses: 22, trend: '↑' },
];

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = React.useState([]);
  const [showAnnForm, setShowAnnForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newContent, setNewContent] = React.useState('');

  React.useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await trainersAPI.listAnnouncements();
      setAnnouncements(res.data.results || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const res = await trainersAPI.createAnnouncement({ title: newTitle, content: newContent });
      setAnnouncements([res.data, ...announcements]);
      setNewTitle('');
      setNewContent('');
      setShowAnnForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const upcoming = MY_SESSIONS.filter(s => s.status === 'upcoming');
  const completed = MY_SESSIONS.filter(s => s.status === 'completed');
  const totalTrained = completed.reduce((s, x) => s + x.attended, 0);
  const avgRating = (MY_FEEDBACK.reduce((s, f) => s + f.rating, 0) / MY_FEEDBACK.length).toFixed(1);

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
          { label: 'Sessions This Month', value: SESSION_TREND[SESSION_TREND.length - 1].sessions, icon: '🏫', color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Trainees Trained', value: totalTrained, icon: '👥', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Avg Trainee Score', value: `${SCORE_TREND[SCORE_TREND.length-1].avg}%`, icon: '📊', color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.12)' },
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
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

          {/* Announcements module */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>📢 Announcements</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAnnForm(!showAnnForm)}>
                {showAnnForm ? 'Cancel' : '+ New Announcement'}
              </button>
            </div>
            
            {showAnnForm && (
              <form onSubmit={handlePostAnnouncement} style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 10, marginBottom: 16 }}>
                <input type="text" placeholder="Announcement Title" className="form-input" style={{ marginBottom: 10 }} value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                <textarea placeholder="Write announcement details..." className="form-textarea" style={{ marginBottom: 10, minHeight: 60 }} value={newContent} onChange={e => setNewContent(e.target.value)} required />
                <button type="submit" className="btn btn-primary btn-sm">Post to Trainees</button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No announcements yet.</p>}
              {announcements.map(ann => (
                <div key={ann.id} style={{ padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong>{ann.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ann.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Ratings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text-primary)' }}>Session Feedback</h3>
            {MY_FEEDBACK.map(f => (
              <div key={f.session} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{f.session}</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>{f.rating} ★</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: `${(f.rating / 5) * 100}%`, background: '#f59e0b', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.responses} responses {f.trend}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Avg Trainee Score Trend</h3>
            <div style={{ height: 120 }}>
              <ResponsiveContainer>
                <LineChart data={SCORE_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
            <BarChart data={SESSION_TREND} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
