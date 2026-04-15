import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { mockClients, mockSites, mockDepartments } from '../data/mockData';

const PASS_FAIL_DATA = [
  { month: 'Oct', passed: 112, failed: 18 },
  { month: 'Nov', passed: 134, failed: 16 },
  { month: 'Dec', passed: 158, failed: 22 },
  { month: 'Jan', passed: 175, failed: 10 },
  { month: 'Feb', passed: 200, failed: 20 },
  { month: 'Mar', passed: 222, failed: 18 },
];

const DEPT_DATA = [
  { dept: 'Security', completion: 95, avg_score: 82 },
  { dept: 'Housekeeping', completion: 78, avg_score: 74 },
  { dept: 'Facility Mgmt', completion: 85, avg_score: 79 },
  { dept: 'IT', completion: 100, avg_score: 91 },
  { dept: 'Maintenance', completion: 68, avg_score: 71 },
];

const MODULE_BREAKDOWN = [
  { name: 'PSARA Foundation', value: 320, color: '#3b82f6' },
  { name: 'Fire Safety', value: 210, color: '#22c55e' },
  { name: 'Emergency Response', value: 185, color: '#f59e0b' },
  { name: 'First Aid & CPR', value: 160, color: '#a855f7' },
  { name: 'Others', value: 409, color: '#484f58' },
];

const TOOLTIP_STYLE = { backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem' };

export default function AnalyticsReportPage() {
  const [filters, setFilters] = useState({ clientId: '', siteId: '', department: '', period: '6months' });
  const handleFilter = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const filteredSites = mockSites.filter(s => !filters.clientId || s.clientId === filters.clientId);

  const totalCompleted = PASS_FAIL_DATA.reduce((s, d) => s + d.passed + d.failed, 0);
  const totalPassed = PASS_FAIL_DATA.reduce((s, d) => s + d.passed, 0);
  const passRate = ((totalPassed / totalCompleted) * 100).toFixed(1);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Training Analytics Report</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Deep-dive into training trends, pass/fail rates, and departmental performance.</p>
        </div>
        <button className="btn btn-secondary">📊 Export Report</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" name="clientId" value={filters.clientId} onChange={handleFilter}>
              <option value="">All Clients</option>
              {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <select className="form-select" name="siteId" value={filters.siteId} onChange={handleFilter}>
              <option value="">All Sites</option>
              {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" name="department" value={filters.department} onChange={handleFilter}>
              <option value="">All Departments</option>
              {mockDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Period</label>
            <select className="form-select" name="period" value={filters.period} onChange={handleFilter}>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last Quarter</option>
              <option value="6months">Last 6 Months</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Sessions', value: totalCompleted, color: 'var(--accent-blue)' },
          { label: 'Passed', value: totalPassed, color: 'var(--accent-green)' },
          { label: 'Failed', value: totalCompleted - totalPassed, color: 'var(--accent-red)' },
          { label: 'Pass Rate', value: `${passRate}%`, color: parseFloat(passRate) > 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Pass vs Fail Trend</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={PASS_FAIL_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <XAxis dataKey="month" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="passed" name="Passed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)', alignSelf: 'flex-start' }}>Training by Module</h3>
          <div style={{ width: '100%', height: 260, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={MODULE_BREAKDOWN} innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" stroke="none">
                  {MODULE_BREAKDOWN.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8 }}>
            {MODULE_BREAKDOWN.map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                  {m.name}
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{m.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 — Department Performance Table */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>Department Performance Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Completion Rate</th>
                <th>Avg Score</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_DATA.map(dept => (
                <tr key={dept.dept}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dept.dept}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${dept.completion}%`, background: dept.completion >= 90 ? 'var(--accent-green)' : dept.completion >= 75 ? 'var(--accent-blue)' : 'var(--accent-yellow)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontWeight: 700, minWidth: 36, color: dept.completion >= 90 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>{dept.completion}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: dept.avg_score >= 85 ? 'var(--accent-green)' : dept.avg_score >= 70 ? 'var(--accent-yellow)' : 'var(--accent-red)' }}>{dept.avg_score}%</td>
                  <td>
                    <span className={`badge ${dept.completion >= 90 ? 'badge-active' : dept.completion >= 75 ? 'badge-draft' : 'badge-retired'}`}>
                      {dept.completion >= 90 ? 'On Track' : dept.completion >= 75 ? 'At Risk' : 'Behind'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
