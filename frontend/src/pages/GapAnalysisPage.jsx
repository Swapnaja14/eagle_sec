import React, { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell,
} from 'recharts'
import { mockClients, mockSites, mockDepartments } from '../data/mockData'

const TOOLTIP_STYLE = {
  backgroundColor: '#161b22', borderColor: '#30363d',
  color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem',
}

const SKILL_GAP_DATA = [
  { skill: 'PSARA Compliance', required: 90, current: 72, gap: 18 },
  { skill: 'Fire Safety', required: 85, current: 80, gap: 5 },
  { skill: 'Emergency Response', required: 88, current: 60, gap: 28 },
  { skill: 'Access Control', required: 80, current: 75, gap: 5 },
  { skill: 'First Aid & CPR', required: 75, current: 45, gap: 30 },
  { skill: 'Digital Security', required: 70, current: 65, gap: 5 },
  { skill: 'Crowd Management', required: 82, current: 55, gap: 27 },
]

const RADAR_DATA = [
  { subject: 'PSARA', A: 72, fullMark: 100 },
  { subject: 'Fire Safety', A: 80, fullMark: 100 },
  { subject: 'Emergency', A: 60, fullMark: 100 },
  { subject: 'Access Ctrl', A: 75, fullMark: 100 },
  { subject: 'First Aid', A: 45, fullMark: 100 },
  { subject: 'Digital Sec', A: 65, fullMark: 100 },
  { subject: 'Crowd Mgmt', A: 55, fullMark: 100 },
]

const DEPT_GAP = [
  { dept: 'Security', gap: 12 },
  { dept: 'Housekeeping', gap: 28 },
  { dept: 'Facility Mgmt', gap: 18 },
  { dept: 'IT', gap: 5 },
  { dept: 'Maintenance', gap: 34 },
]

const gapColor = (gap) => {
  if (gap >= 25) return '#ef4444'
  if (gap >= 15) return '#f59e0b'
  return '#22c55e'
}

export default function GapAnalysisPage() {
  const [filters, setFilters] = useState({ clientId: '', siteId: '', department: '' })
  const handleFilter = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const filteredSites = mockSites.filter(s => !filters.clientId || s.clientId === filters.clientId)

  const criticalGaps = SKILL_GAP_DATA.filter(s => s.gap >= 20)
  const totalGapScore = Math.round(SKILL_GAP_DATA.reduce((a, s) => a + s.gap, 0) / SKILL_GAP_DATA.length)

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Gap Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Identify skill deficiencies and training gaps across departments and modules.
          </p>
        </div>
        <button className="btn btn-secondary">📥 Export Gap Report</button>
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
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Avg Skill Gap', value: `${totalGapScore}%`, color: totalGapScore > 20 ? 'var(--accent-red)' : 'var(--accent-yellow)' },
          { label: 'Critical Gaps', value: criticalGaps.length, color: 'var(--accent-red)' },
          { label: 'Skills Assessed', value: SKILL_GAP_DATA.length, color: 'var(--accent-blue)' },
          { label: 'Depts at Risk', value: DEPT_GAP.filter(d => d.gap >= 20).length, color: 'var(--accent-yellow)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
        {/* Bar chart — skill gaps */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Required vs Current Proficiency
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={SKILL_GAP_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <XAxis dataKey="skill" stroke="#8b949e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8b949e" domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="required" name="Required" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="current" name="Current" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Skill Coverage Radar
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#21262d" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gap Table */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Skill Gap Breakdown
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Skill / Module</th>
              <th>Required</th>
              <th>Current</th>
              <th>Gap</th>
              <th>Priority</th>
              <th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {SKILL_GAP_DATA.map(row => (
              <tr key={row.skill}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.skill}</td>
                <td style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{row.required}%</td>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{row.current}%</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${(row.gap / row.required) * 100}%`, background: gapColor(row.gap), borderRadius: 999 }} />
                    </div>
                    <span style={{ fontWeight: 800, color: gapColor(row.gap), minWidth: 36 }}>{row.gap}%</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${row.gap >= 25 ? 'badge-retired' : row.gap >= 15 ? 'badge-draft' : 'badge-active'}`}>
                    {row.gap >= 25 ? 'Critical' : row.gap >= 15 ? 'Moderate' : 'Low'}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {row.gap >= 25 ? '🚨 Schedule immediate training' : row.gap >= 15 ? '⚠️ Plan refresher course' : '✅ Maintain current schedule'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Department Gap */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Department-wise Gap Score
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {DEPT_GAP.map(d => (
            <div key={d.dept} className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{d.dept}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: gapColor(d.gap) }}>{d.gap}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>avg gap</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
