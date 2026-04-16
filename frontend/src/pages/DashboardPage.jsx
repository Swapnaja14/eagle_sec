import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    cards: null,
    department_completion: [],
    monthly_trend: [],
    upcoming_sessions: [],
    compliance_alerts: [],
    recent_history: [],
  });

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/overview/', { params: { range } });
      setOverview({
        cards: data.cards || null,
        department_completion: data.department_completion || [],
        monthly_trend: data.monthly_trend || [],
        upcoming_sessions: data.upcoming_sessions || [],
        compliance_alerts: data.compliance_alerts || [],
        recent_history: data.recent_history || [],
      });
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to load dashboard data.';
      setError(typeof detail === 'string' ? detail : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [range]);

  const dashboardCards = useMemo(() => {
    const cards = overview.cards || {};
    return {
      totalTrained: {
        value: cards.total_trained?.value || 0,
        trend: cards.total_trained?.delta || '+0.0%',
        trendUp: cards.total_trained?.trend_up ?? true,
      },
      avgScore: {
        value: cards.avg_score?.value || 0,
        trend: cards.avg_score?.delta || '+0.0%',
        trendUp: cards.avg_score?.trend_up ?? true,
      },
      complianceRate: {
        value: cards.compliance_rate?.value || 0,
        trend: cards.compliance_rate?.delta || '+0.0%',
        trendUp: cards.compliance_rate?.trend_up ?? true,
      },
      pendingCerts: {
        value: cards.pending_certifications?.value || 0,
        trend: cards.pending_certifications?.delta || '+0.0%',
        trendUp: cards.pending_certifications?.trend_up ?? true,
      },
    };
  }, [overview.cards]);

  const departmentData = useMemo(
    () => overview.department_completion.map(d => ({
      name: d.department,
      actual: d.actual_percent,
      target: d.target_percent,
    })),
    [overview.department_completion]
  );

  const trendData = useMemo(
    () => overview.monthly_trend.map(t => ({
      month: t.month,
      enrolled: t.enrolled,
      completed: t.completed,
    })),
    [overview.monthly_trend]
  );

  const upcomingSessions = useMemo(
    () => overview.upcoming_sessions.map(s => ({
      id: s.id,
      type: s.type,
      topic: s.topic,
      date: new Date(s.date_time).toLocaleString(),
      trainerName: s.trainer_name || 'N/A',
      attendeeCount: s.attendee_count,
    })),
    [overview.upcoming_sessions]
  );

  const complianceAlerts = useMemo(
    () => overview.compliance_alerts.map(a => ({
      id: a.id,
      dept: a.department || a.site || 'Unknown',
      behind: a.behind_percent,
    })),
    [overview.compliance_alerts]
  );

  const recentHistory = useMemo(
    () => overview.recent_history.map(r => ({
      id: `${r.employee_id}-${r.session_date}`,
      employeeName: r.employee_name,
      employeeId: r.employee_id,
      moduleName: r.module_name,
      sessionDate: r.session_date,
      score: r.score,
      status: r.status,
    })),
    [overview.recent_history]
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-hero-title">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.first_name || user?.username}. Here's the training overview.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/sessions/classroom/new')}>
          Assign New Training
        </button>
      </div>

      <div className="dashboard-content">
        {/* KPI Cards */}
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-card-top">
              <span className="stat-icon" style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-light)', padding: 8, borderRadius: 8 }}>👥</span>
              <span className={`stat-trend ${dashboardCards.totalTrained.trendUp ? 'up' : 'down'}`}>
                {dashboardCards.totalTrained.trend} {dashboardCards.totalTrained.trendUp ? '↑' : '↓'}
              </span>
            </div>
            <div className="stat-value">{dashboardCards.totalTrained.value.toLocaleString()}</div>
            <h3 className="stat-label">Total Trained</h3>
          </div>
          
          <div className="stat-card card">
            <div className="stat-card-top">
              <span className="stat-icon" style={{ color: 'var(--accent-green)', background: 'rgba(34, 197, 94, 0.15)', padding: 8, borderRadius: 8 }}>📊</span>
              <span className={`stat-trend ${dashboardCards.avgScore.trendUp ? 'up' : 'down'}`}>
                {dashboardCards.avgScore.trend} {dashboardCards.avgScore.trendUp ? '↑' : '↓'}
              </span>
            </div>
            <div className="stat-value">{dashboardCards.avgScore.value}%</div>
            <h3 className="stat-label">Average Score</h3>
          </div>

          <div className="stat-card card">
            <div className="stat-card-top">
              <span className="stat-icon" style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.15)', padding: 8, borderRadius: 8 }}>🛡️</span>
              <span className={`stat-trend ${dashboardCards.complianceRate.trendUp ? 'up' : 'down'}`}>
                {dashboardCards.complianceRate.trend} {dashboardCards.complianceRate.trendUp ? '↑' : '↓'}
              </span>
            </div>
            <div className="stat-value">{dashboardCards.complianceRate.value}%</div>
            <h3 className="stat-label">Compliance Rate</h3>
          </div>

          <div className="stat-card card alert">
            <div className="stat-card-top">
              <span className="stat-icon" style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.15)', padding: 8, borderRadius: 8 }}>⚠️</span>
              <span className={`stat-trend ${dashboardCards.pendingCerts.trendUp ? 'up' : 'down'}`}>
                {dashboardCards.pendingCerts.trend} {dashboardCards.pendingCerts.trendUp ? '↑' : '↓'}
              </span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{dashboardCards.pendingCerts.value}</div>
            <h3 className="stat-label">Pending Certifications</h3>
          </div>
        </div>

        <div className="dashboard-main-layout">
          {/* Main Content: Charts */}
          <div className="charts-column">
            <div className="chart-card card">
              <div className="chart-header">
                <h3 className="chart-title">Training Completion by Department</h3>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 36px 6px 12px' }}
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="ytd">YTD</option>
                </select>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                    <XAxis type="number" stroke="#8b949e" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#8b949e" />
                    <Tooltip cursor={{ fill: '#1c2433' }} contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                    <Legend />
                    <Bar dataKey="actual" name="Actual %" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="target" name="Target %" fill="#484f58" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card card">
              <div className="chart-header">
                <h3 className="chart-title">Monthly Training Trend</h3>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                    <XAxis dataKey="month" stroke="#8b949e" />
                    <YAxis stroke="#8b949e" />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                    <Legend />
                    <Line type="monotone" dataKey="enrolled" name="Enrolled" stroke="#8b949e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Side Panel: Sessions & Alerts */}
          <div className="side-panel">
            <div className="card">
              <h3 className="chart-title" style={{ marginBottom: 20 }}>Upcoming Sessions</h3>
              {upcomingSessions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No upcoming sessions.</p>}
              {upcomingSessions.map(session => (
                <div key={session.id} className="timeline-card">
                  <div className="timeline-icon">
                    {session.type === 'virtual' ? '💻' : '🏫'}
                  </div>
                  <div className="timeline-content" style={{ flex: 1 }}>
                    <h4>{session.topic}</h4>
                    <p className="timeline-meta">{session.date}</p>
                    <p className="timeline-meta">Trainer: {session.trainerName} • {session.attendeeCount} pax</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="chart-title" style={{ marginBottom: 20 }}>Compliance Alerts</h3>
              {complianceAlerts.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active alerts.</p>}
              {complianceAlerts.map(alert => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-info">
                    <h4>{alert.dept}</h4>
                    <p>{alert.behind}% behind schedule</p>
                  </div>
                  <button className="btn btn-danger btn-sm">Notify</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="recent-history-section">
          <div className="recent-history-header">
            <h3 className="chart-title">Recent Training History</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employee/history')}>View All</button>
          </div>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Module</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.employeeName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.employeeId}</div>
                    </td>
                    <td>{record.moduleName}</td>
                    <td>{new Date(record.sessionDate).toLocaleDateString()}</td>
                    <td>
                      {record.score !== null ? (
                        <span style={{ 
                          color: record.score >= 80 ? 'var(--accent-green)' : record.score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                          fontWeight: 700 
                        }}>
                          {record.score}%
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge badge-${record.status === 'passed' ? 'active' : record.status === 'failed' ? 'retired' : record.status === 'in-progress' ? 'draft' : 'archived'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && recentHistory.length === 0 && (
              <div style={{ padding: 14, color: 'var(--text-muted)' }}>No recent training history.</div>
            )}
          </div>
        </div>

      </div>
      {loading && <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading dashboard data...</div>}
      {error && <div style={{ marginTop: 12, color: 'var(--accent-red)' }}>{error}</div>}
    </div>
  );
}
