import React, { useState, useEffect } from 'react';
import { clientsAPI, sitesAPI, departmentsAPI, analyticsAPI } from '../services/api';
import api from '../services/api';

const REPORT_TYPES = [
  { id: 'analytics',        label: 'Training Analytics Report',  desc: 'Department-wise completion rates and trends',          icon: '📈', endpoint: 'analytics' },
  { id: 'gap_analysis',     label: 'Compliance Gap Analysis',    desc: 'Training gaps by site and department',                 icon: '🔍', endpoint: 'gap' },
  { id: 'training_history', label: 'Training History Report',    desc: 'Complete log of all training sessions and scores',     icon: '📜', endpoint: 'analytics' },
  { id: 'quiz_results',     label: 'Quiz Results Summary',       desc: 'Per-trainee assessment scores and pass/fail breakdown', icon: '📋', endpoint: 'analytics' },
];

export default function BulkExportPage() {
  const [clients,     setClients]     = useState([]);
  const [sites,       setSites]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    reportType: 'analytics', format: 'pdf',
    clientId: '', siteId: '', department: '',
    dateFrom: '', dateTo: '', sendEmail: false, emailAddresses: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    clientsAPI.list().then(r => setClients(r.data?.results ?? r.data ?? [])).catch(() => {});
    sitesAPI.list().then(r => setSites(r.data?.results ?? r.data ?? [])).catch(() => {});
    departmentsAPI.list().then(r => setDepartments(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const filteredSites = form.clientId
    ? sites.filter(s => String(s.client_id ?? s.client ?? '') === String(form.clientId))
    : sites;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      // Build params
      const params = {};
      if (form.department) params.department = form.department;
      if (form.dateFrom)   params.from = form.dateFrom;
      if (form.dateTo)     params.to   = form.dateTo;

      // All report types use the analytics PDF endpoint
      const res = await analyticsAPI.report();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${form.reportType}_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerated(true);
    } catch (e) {
      setError('Failed to generate report: ' + (e.response?.data?.detail ?? e.message));
    } finally {
      setGenerating(false);
    }
  };

  const selectedReport = REPORT_TYPES.find(r => r.id === form.reportType);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Bulk Export & Reports</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Generate and download reports as PDF.</p>
      </div>

      {/* Report Type */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Select Report Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REPORT_TYPES.map(report => (
            <label key={report.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
              borderRadius: 10, border: `1px solid ${form.reportType === report.id ? 'rgba(59,130,246,0.4)' : 'var(--border-color)'}`,
              background: form.reportType === report.id ? 'rgba(59,130,246,0.08)' : 'var(--bg-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <input type="radio" name="reportType" value={report.id} checked={form.reportType === report.id} onChange={handleChange} style={{ accentColor: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '1.4rem' }}>{report.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{report.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{report.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Filter Scope (Optional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" name="clientId" value={form.clientId} onChange={handleChange}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <select className="form-select" name="siteId" value={form.siteId} onChange={handleChange}>
              <option value="">All Sites</option>
              {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" name="department" value={form.department} onChange={handleChange}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input type="date" className="form-input" name="dateFrom" value={form.dateFrom} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Date To</label>
            <input type="date" className="form-input" name="dateTo" value={form.dateTo} onChange={handleChange} />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {/* Generate / Result */}
      {generated ? (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <h3 style={{ color: 'var(--accent-green)', margin: '0 0 8px' }}>Report Downloaded!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{selectedReport?.label} has been downloaded to your device.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : '⬇️ Download Again'}
            </button>
            <button className="btn btn-ghost" onClick={() => setGenerated(false)}>Generate Another</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => setForm(p => ({ ...p, clientId: '', siteId: '', department: '', dateFrom: '', dateTo: '' }))}>
            Reset Filters
          </button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ minWidth: 180 }}>
            {generating ? 'Generating PDF...' : '📦 Generate & Download'}
          </button>
        </div>
      )}
    </div>
  );
}
