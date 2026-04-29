import React, { useState, useEffect, useCallback } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts'
import { analyticsAPI } from '../services/api'

const TOOLTIP_STYLE = {
  backgroundColor: '#161b22', borderColor: '#30363d',
  color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem',
}

const gapColor = (gap) => {
  if (gap >= 25) return '#ef4444'
  if (gap >= 15) return '#f59e0b'
  return '#22c55e'
}

export default function GapAnalysisPage() {
  const [department, setDepartment] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchGapData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (department) params.department = department
      const res = await analyticsAPI.gapAnalysis(params)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load gap analysis data.')
    } finally {
      setLoading(false)
    }
  }, [department])

  useEffect(() => { fetchGapData() }, [fetchGapData])

  const skillGaps = data?.skill_gaps ?? []
  const deptGaps = data?.dept_gaps ?? []
  const radarData = data?.radar_data ?? []
  const summary = data?.summary ?? {}

  // Unique departments from dept_gaps for filter dropdown
  const departments = [...new Set(deptGaps.map(d => d.dept).filter(Boolean))]

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Gap Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Live skill deficiencies and training gaps based on actual assessment scores vs required thresholds.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchGapData} disabled={loading}>
          {loading ? '⏳ Loading…' : '🔄 Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchGapData} disabled={loading} style={{ height: 40 }}>
            Apply Filter
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Avg Skill Gap',
            value: loading ? '—' : `${summary.avg_gap ?? 0}%`,
            color: (summary.avg_gap ?? 0) > 20 ? 'var(--accent-red)' : 'var(--accent-yellow)',
          },
          {
            label: 'Critical Gaps',
            value: loading ? '—' : summary.critical_gaps ?? 0,
            color: 'var(--accent-red)',
          },
          {
            label: 'Courses Assessed',
            value: loading ? '—' : summary.skills_assessed ?? 0,
            color: 'var(--accent-blue)',
          },
          {
            label: 'Depts at Risk',
            value: loading ? '—' : summary.depts_at_risk ?? 0,
            color: 'var(--accent-yellow)',
          },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
        {/* Bar chart — required vs current */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Required vs Current Proficiency
          </h3>
          {loading ? <Skeleton height={300} /> : skillGaps.length === 0 ? <Empty /> : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={skillGaps}
                  margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <XAxis
                    dataKey="skill"
                    stroke="#8b949e"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#8b949e" domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="required" name="Required %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="current" name="Current %" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Skill Coverage Radar
          </h3>
          {loading ? <Skeleton height={300} /> : radarData.length === 0 ? <Empty /> : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#21262d" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                  <Radar name="Required" dataKey="required" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeDasharray="4 2" />
                  <Radar name="Current" dataKey="current" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Skill Gap Table */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Course-wise Skill Gap Breakdown
        </h3>
        {loading ? <Skeleton height={200} /> : skillGaps.length === 0 ? <Empty message="No course data found. Add active courses with post-assessments." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course / Skill</th>
                  <th>Required</th>
                  <th>Current Avg</th>
                  <th>Gap</th>
                  <th>Priority</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {skillGaps.map(row => (
                  <tr key={row.course_id ?? row.skill}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.skill}</td>
                    <td style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{row.required}%</td>
                    <td style={{ color: row.current >= row.required ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: 700 }}>
                      {row.current}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min((row.gap / Math.max(row.required, 1)) * 100, 100)}%`,
                            background: gapColor(row.gap),
                            borderRadius: 999,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontWeight: 800, color: gapColor(row.gap), minWidth: 40 }}>
                          {row.gap}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.gap >= 25 ? 'badge-retired' : row.gap >= 15 ? 'badge-draft' : 'badge-active'}`}>
                        {row.gap >= 25 ? 'Critical' : row.gap >= 15 ? 'Moderate' : 'Low'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {row.gap >= 25
                        ? '🚨 Schedule immediate training'
                        : row.gap >= 15
                        ? '⚠️ Plan refresher course'
                        : '✅ Maintain current schedule'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Gap Cards */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Department-wise Gap Score
        </h3>
        {loading ? <Skeleton height={120} /> : deptGaps.length === 0 ? <Empty message="No department data available." /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {deptGaps.map(d => (
              <div key={d.dept} className="card" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  {d.dept}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: gapColor(d.gap) }}>{d.gap}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>avg gap</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  avg score: <strong style={{ color: 'var(--text-secondary)' }}>{d.avg_score}%</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Skeleton({ height = 200 }) {
  return (
    <div style={{ height, background: 'var(--bg-tertiary)', borderRadius: 8, opacity: 0.5 }} />
  )
}
function Empty({ message = 'No data available.' }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      📭 {message}
    </div>
  )
}
