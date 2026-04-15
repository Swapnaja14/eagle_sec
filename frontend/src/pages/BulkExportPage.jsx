import React, { useState } from 'react';
import { mockClients, mockSites, mockDepartments } from '../data/mockData';

const REPORT_TYPES = [
  { id: 'training_history', label: 'Training History Report', desc: 'Complete log of all training sessions and scores', icon: '📜' },
  { id: 'psara_compliance', label: 'PSARA Compliance Report', desc: 'Guard certification status and expiry tracking', icon: '🛡️' },
  { id: 'quiz_results', label: 'Quiz Results Summary', desc: 'Per-trainee assessment scores and pass/fail breakdown', icon: '📋' },
  { id: 'analytics', label: 'Training Analytics Report', desc: 'Department-wise completion rates and trends', icon: '📈' },
  { id: 'gap_analysis', label: 'Compliance Gap Analysis', desc: 'Training gaps by site and department', icon: '🔍' },
];

export default function BulkExportPage() {
  const [form, setForm] = useState({
    reportType: 'training_history',
    format: 'excel',
    clientId: '',
    siteId: '',
    department: '',
    dateFrom: '',
    dateTo: '',
    sendEmail: false,
    emailAddresses: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const filteredSites = mockSites.filter(s => !form.clientId || s.clientId === form.clientId);
  const selectedReport = REPORT_TYPES.find(r => r.id === form.reportType);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Bulk Export & Notifications</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Generate and download reports with optional email delivery.</p>
      </div>

      {/* Report Type Selection */}
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
              {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              {mockDepartments.map(d => <option key={d} value={d}>{d}</option>)}
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

      {/* Export Format */}
      <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Export Format</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ id: 'excel', label: '📊 Excel (.xlsx)', desc: 'Best for data analysis' }, { id: 'pdf', label: '📄 PDF', desc: 'Best for printing' }, { id: 'csv', label: '📋 CSV', desc: 'Raw data, universal' }].map(f => (
            <label key={f.id} style={{
              display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 20px',
              border: `2px solid ${form.format === f.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              background: form.format === f.id ? 'var(--accent-blue-light)' : 'var(--bg-secondary)',
              borderRadius: 10, cursor: 'pointer', flex: 1, textAlign: 'center',
            }}>
              <input type="radio" name="format" value={f.id} checked={form.format === f.id} onChange={handleChange} style={{ display: 'none' }} />
              <span style={{ fontSize: '1.1rem', color: form.format === f.id ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: 700 }}>{f.label}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Email Notification */}
      <div className="card" style={{ padding: '20px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: form.sendEmail ? 16 : 0 }}>
          <label className="toggle">
            <input type="checkbox" name="sendEmail" checked={form.sendEmail} onChange={handleChange} />
            <span className="toggle-slider" />
          </label>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Send via Email</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Deliver this report to specified email addresses</div>
          </div>
        </div>
        {form.sendEmail && (
          <div className="form-group">
            <label className="form-label">Email Addresses (comma-separated)</label>
            <input className="form-input" name="emailAddresses" value={form.emailAddresses} onChange={handleChange} placeholder="admin@company.com, hr@company.com..." />
          </div>
        )}
      </div>

      {/* Generate Button */}
      {generated ? (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <h3 style={{ color: 'var(--accent-green)', margin: '0 0 8px' }}>Report Generated Successfully!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{selectedReport?.label} is ready for download.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => alert('Download started (mock)')}>⬇️ Download {form.format.toUpperCase()}</button>
            {form.sendEmail && <button className="btn btn-secondary">📧 Send Email</button>}
            <button className="btn btn-ghost" onClick={() => setGenerated(false)}>Generate Another</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-ghost">Reset Filters</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ minWidth: 180 }}>
            {generating ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating...</>
            ) : '📦 Generate Report'}
          </button>
        </div>
      )}
    </div>
  );
}
