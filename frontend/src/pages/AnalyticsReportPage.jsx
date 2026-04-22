import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import api, { clientsAPI, sitesAPI, departmentsAPI } from '../services/api';

const TOOLTIP_STYLE = {
  backgroundColor: '#161b22', borderColor: '#30363d',
  color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem',
};
const MODULE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ef4444', '#84cc16'];

// ── date helpers ──────────────────────────────────────────────────────────────
const today      = () => new Date().toISOString().slice(0, 10);
const daysAgo    = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const startOfYear = () => `${new Date().getFullYear()}-01-01`;
const periodRange = (period) => {
  switch (period) {
    case '30days':  return { from: daysAgo(30),  to: today() };
    case '3months': return { from: daysAgo(90),  to: today() };
    case 'ytd':     return { from: startOfYear(), to: today() };
    default:        return { from: daysAgo(180), to: today() }; // 6months
  }
};

export default function AnalyticsReportPage() {
  // ── filter state ────────────────────────────────────────────────────────────
  const [period,     setPeriod]     = useState('6months');
  const [clientId,   setClientId]   = useState('');
  const [siteId,     setSiteId]     = useState('');
  const [department, setDepartment] = useState('');

  // ── dropdown option lists ───────────────────────────────────────────────────
  const [clients,     setClients]     = useState([]);
  const [sites,       setSites]       = useState([]);
  const [departments, setDepartments] = useState([]);

  // ── data state ──────────────────────────────────────────────────────────────
  const [summary,        setSummary]        = useState(null);
  const [trend,          setTrend]          = useState([]);
  const [deptCompletion, setDeptCompletion] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [exporting,      setExporting]      = useState(false);

  // ── load clients, sites, departments once ──────────────────────────────────
  useEffect(() => {
    clientsAPI.list()
      .then(r => setClients(r.data?.results ?? r.data ?? []))
      .catch(() => {});
    sitesAPI.list()
      .then(r => setSites(r.data?.results ?? r.data ?? []))
      .catch(() => {});
    departmentsAPI.list()
      .then(r => setDepartments(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  // Sites filtered by selected client (uses client_id field from serializer)
  const filteredSites = clientId
    ? sites.filter(s => String(s.client_id ?? '') === String(clientId))
    : sites;

  // ── fetch data whenever any filter changes ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError('');

      const { from, to } = periodRange(period);
      const params = { from, to };
      if (department) params.department = department;
      if (siteId)     params.site       = siteId;

      try {
        const [summaryRes, trendRes, deptRes] = await Promise.all([
          api.get('/dashboard/summary/',              { params }),
          api.get('/dashboard/training-trend/',       { params }),
          api.get('/dashboard/department-completion/', { params }),
        ]);

        if (cancelled) return;

        const cards = summaryRes.data;
        setSummary({
          total_trained:    cards.total_trained?.value          ?? 0,
          avg_score:        cards.avg_score?.value              ?? 0,
          compliance_rate:  cards.compliance_rate?.value        ?? 0,
          pending_certs:    cards.pending_certifications?.value ?? 0,
          total_delta:      cards.total_trained?.delta          ?? '',
          score_delta:      cards.avg_score?.delta              ?? '',
          compliance_delta: cards.compliance_rate?.delta        ?? '',
          pending_delta:    cards.pending_certifications?.delta ?? '',
        });
        setTrend(trendRes.data ?? []);
        setDeptCompletion(deptRes.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail ?? 'Failed to load analytics data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [period, department, siteId]); // re-runs whenever any filter changes

  // ── export PDF ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/analytics/report/', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `analytics_report_${today()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── derived chart data ──────────────────────────────────────────────────────
  const passFailData = trend.map(t => ({
    month:    t.month,
    Completed: t.completed ?? 0,
    Incomplete: Math.max(0, (t.enrolled ?? 0) - (t.completed ?? 0)),
  }));

  const deptChartData = deptCompletion.map(d => ({
    dept:       d.department || 'Unassigned',
    completion: d.actual_percent  ?? 0,
    target:     d.target_percent  ?? 90,
  }));

  const pieData = deptCompletion.slice(0, 7).map((d, i) => ({
    name:  d.department || 'Unassigned',
    value: Math.round(d.actual_percent ?? 0),
    color: MODULE_COLORS[i % MODULE_COLORS.length],
  }));

  const totalCompleted = passFailData.reduce((s, d) => s + d.Completed,   0);
  const totalEnrolled  = passFailData.reduce((s, d) => s + d.Completed + d.Incomplete, 0);
  const passRate       = totalEnrolled > 0 ? ((totalCompleted / totalEnrolled) * 100).toFixed(1) : '0.0';

  // Unique departments from live data for the department dropdown
  const deptOptions = [...new Set(deptCompletion.map(d => d.department).filter(Boolean))];

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Training Analytics Report
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Live training trends, pass/fail rates, and departmental performance.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Generating...' : 'Export PDF Report'}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, alignItems: 'flex-end' }}>

          {/* Client */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Client</label>
            <select
              className="form-select"
              value={clientId}
              onChange={e => { setClientId(e.target.value); setSiteId(''); }}
            >
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Site */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Site</label>
            <select
              className="form-select"
              value={siteId}
              onChange={e => setSiteId(e.target.value)}
            >
              <option value="">All Sites</option>
              {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Department — from dedicated /auth/departments/ endpoint */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Period */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Period</label>
            <select
              className="form-select"
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last Quarter</option>
              <option value="6months">Last 6 Months</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
            {loading
              ? <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading...</span>
              : <span style={{ fontSize: '0.82rem', color: 'var(--accent-green)' }}>Data loaded</span>
            }
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Enrolled',   value: loading ? '—' : totalEnrolled.toLocaleString(),          delta: summary?.total_delta,      color: 'var(--accent-blue)' },
          { label: 'Completed',        value: loading ? '—' : totalCompleted.toLocaleString(),         delta: '',                         color: 'var(--accent-green)' },
          { label: 'Pass Rate',        value: loading ? '—' : `${passRate}%`,                          delta: summary?.score_delta,       color: parseFloat(passRate) >= 80 ? 'var(--accent-green)' : 'var(--accent-yellow)' },
          { label: 'Compliance Rate',  value: loading ? '—' : `${summary?.compliance_rate ?? 0}%`,     delta: summary?.compliance_delta,  color: 'var(--accent-cyan)' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            {kpi.delta && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {kpi.delta} vs prev period
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>

        {/* Bar — monthly enrolled vs completed */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Monthly Enrolled vs Completed
          </h3>
          {loading ? <Skeleton height={300} /> : passFailData.length === 0 ? <Empty /> : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={passFailData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <XAxis dataKey="month" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="Completed"  fill="#22c55e" radius={[4, 4, 0, 0]} barSize={26} />
                  <Bar dataKey="Incomplete" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie — completion by department */}
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Completion by Department
          </h3>
          {loading ? <Skeleton height={240} /> : pieData.length === 0 ? <Empty /> : (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {pieData.map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                      {m.name}
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{m.value}%</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Line Chart — trend ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Training Enrollment Trend
        </h3>
        {loading ? <Skeleton height={260} /> : trend.length === 0 ? <Empty /> : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <XAxis dataKey="month" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Line type="monotone" dataKey="enrolled"  name="Enrolled"  stroke="#8b949e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Department Performance Table ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Department Performance Breakdown
        </h3>
        {loading ? <Skeleton height={200} /> : deptChartData.length === 0
          ? <Empty message="No department data for this period." />
          : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Completion Rate</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deptChartData.map(dept => (
                    <tr key={dept.dept}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{dept.dept}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 999 }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(dept.completion, 100)}%`,
                              background: dept.completion >= 90 ? 'var(--accent-green)' : dept.completion >= 75 ? 'var(--accent-blue)' : 'var(--accent-yellow)',
                              borderRadius: 999,
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                          <span style={{ fontWeight: 700, minWidth: 44, color: dept.completion >= 90 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                            {dept.completion.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{dept.target}%</td>
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
          )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Skeleton({ height = 200 }) {
  return (
    <div style={{
      height, background: 'var(--bg-tertiary)', borderRadius: 8, opacity: 0.5,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}
function Empty({ message = 'No data available for this period.' }) {
  return (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      {message}
    </div>
  );
}
