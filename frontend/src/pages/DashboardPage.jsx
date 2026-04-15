import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { dashboardCards, upcomingSessions, complianceAlerts, mockTrainingRecords } from '../data/mockData';
import './DashboardPage.css';

const departmentData = [
  { name: 'Security', actual: 95, target: 100 },
  { name: 'Housekeeping', actual: 82, target: 90 },
  { name: 'Facility', actual: 88, target: 95 },
  { name: 'IT', actual: 100, target: 100 },
  { name: 'Maintenance', actual: 75, target: 85 }
];

const trendData = [
  { month: 'Oct', enrolled: 120, completed: 100 },
  { month: 'Nov', enrolled: 150, completed: 130 },
  { month: 'Dec', enrolled: 180, completed: 170 },
  { month: 'Jan', enrolled: 200, completed: 185 },
  { month: 'Feb', enrolled: 220, completed: 210 },
  { month: 'Mar', enrolled: 250, completed: 240 }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
                <select className="form-select" style={{ width: 'auto', padding: '6px 36px 6px 12px' }}>
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>YTD</option>
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
                {mockTrainingRecords.slice(0, 5).map(record => (
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
          </div>
        </div>

      </div>
    </div>
  );
}
