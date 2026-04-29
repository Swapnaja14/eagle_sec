import React, { useState, useEffect, useCallback } from 'react';
import api, { certTemplatesAPI } from '../services/api';

const THEMES = [
  { value: 'corporate_blue',  label: 'Corporate Blue' },
  { value: 'corporate_dark',  label: 'Corporate Dark' },
  { value: 'minimalist',      label: 'Minimalist' },
  { value: 'academic_formal', label: 'Academic Formal' },
  { value: 'gold_elegant',    label: 'Gold Elegant' },
];

const EMPTY_TEMPLATE = {
  title: '', company_name: '', layout: 'landscape', theme: 'corporate_blue',
  heading_text: 'Certificate of Completion',
  sub_heading: 'This is to certify that',
  body_text: 'has successfully completed the course and demonstrated the required competencies.',
  footer_text: '', trainer_name: '', trainer_title: 'Authorized Trainer',
  validity_days: 0,
};

export default function CertificateIssuingPage() {
  const [activeTab, setActiveTab] = useState('issue'); // issue | templates

  // ── Issue tab state ─────────────────────────────────────────────────────────
  const [submissions,  setSubmissions]  = useState([]);
  const [templates,    setTemplates]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [certLoading,  setCertLoading]  = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('passed');
  const [selectedTpl,  setSelectedTpl]  = useState('');

  // ── Template tab state ──────────────────────────────────────────────────────
  const [tplLoading,   setTplLoading]   = useState(false);
  const [tplError,     setTplError]     = useState('');
  const [tplSuccess,   setTplSuccess]   = useState('');
  const [editingTpl,   setEditingTpl]   = useState(null); // null = closed, {} = new, {id,...} = edit
  const [tplForm,      setTplForm]      = useState(EMPTY_TEMPLATE);

  // ── Load data ───────────────────────────────────────────────────────────────
  const loadSubmissions = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/assessments/submissions/', { params: { page_size: 200 } });
      setSubmissions(res.data?.results ?? res.data ?? []);
    } catch (e) {
      setError('Failed to load submissions: ' + (e.response?.data?.detail ?? e.message));
    } finally { setLoading(false); }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await certTemplatesAPI.list();
      setTemplates(res.data ?? []);
    } catch { setTemplates([]); }
  }, []);

  useEffect(() => { loadSubmissions(); loadTemplates(); }, [loadSubmissions, loadTemplates]);

  // ── Issue certificate ───────────────────────────────────────────────────────
  const handleIssue = async (submissionId, name, course) => {
    setCertLoading(true); setError(''); setSuccess('');
    try {
      const body = { submission_id: submissionId };
      if (selectedTpl) body.template_id = parseInt(selectedTpl);
      const res = await api.post('/certificates/generate/', body);
      const cert = res.data;
      setSuccess(`Certificate #${cert.id} issued for ${name} — ${course}.`);
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, _cert_id: cert.id, _cert_issued: true } : s)
      );
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Failed to issue certificate.');
    } finally { setCertLoading(false); }
  };

  const handleDownload = async (certId, fmt = 'pdf') => {
    try {
      const res = await api.get(`/certificates/${certId}/download/${fmt}/`, { responseType: 'blob' });
      const mime = fmt === 'png' ? 'image/png' : 'application/pdf';
      const ext  = fmt === 'png' ? 'png' : 'pdf';
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url; a.download = `certificate_${certId}.${ext}`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Download failed.'); }
  };

  // ── Template CRUD ───────────────────────────────────────────────────────────
  const openNewTemplate = () => { setTplForm(EMPTY_TEMPLATE); setEditingTpl({}); setTplError(''); setTplSuccess(''); };
  const openEditTemplate = (t) => { setTplForm({ ...t }); setEditingTpl(t); setTplError(''); setTplSuccess(''); };

  const saveTpl = async () => {
    if (!tplForm.title.trim()) { setTplError('Template title is required.'); return; }
    setTplLoading(true); setTplError('');
    try {
      const fd = new FormData();
      Object.entries(tplForm).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
      if (editingTpl?.id) {
        await certTemplatesAPI.update(editingTpl.id, fd);
        setTplSuccess('Template updated.');
      } else {
        await certTemplatesAPI.create(fd);
        setTplSuccess('Template created.');
      }
      await loadTemplates();
      setEditingTpl(null);
    } catch (e) {
      setTplError(e.response?.data?.detail ?? JSON.stringify(e.response?.data) ?? 'Save failed.');
    } finally { setTplLoading(false); }
  };

  const deleteTpl = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try { await certTemplatesAPI.delete(id); await loadTemplates(); }
    catch { alert('Delete failed.'); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = submissions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.passed;
    const name = `${s.user?.username ?? ''} ${s.quiz?.title ?? ''}`.toLowerCase();
    return matchStatus && (!search || name.includes(search.toLowerCase()));
  });

  const passedCount = submissions.filter(s => s.passed && s.status === 'completed').length;
  const issuedCount = submissions.filter(s => s._cert_issued).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px 24px', maxWidth: 1300, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Certificate Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Create templates and issue PDF + PNG certificates to trainees who passed assessments.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
        {[['issue', 'Issue Certificates'], ['templates', 'Certificate Templates']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem', borderRadius: '8px 8px 0 0',
              background: activeTab === key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === key ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === key ? '2px solid var(--accent-blue)' : '2px solid transparent',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── TAB: ISSUE CERTIFICATES ── */}
      {activeTab === 'issue' && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Total Submissions', value: submissions.length, color: 'var(--accent-blue)' },
              { label: 'Passed',            value: passedCount,        color: 'var(--accent-green)' },
              { label: 'Certs Issued',      value: issuedCount,        color: 'var(--accent-cyan)' },
              { label: 'Templates',         value: templates.length,   color: 'var(--accent-yellow)' },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {error   && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: 'var(--accent-red)' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--accent-green)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: 'var(--accent-green)' }}>{success}</div>}

          {/* Filters */}
          <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input className="form-input" placeholder="Search trainee or course..." value={search}
                onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 160 }}>
                <option value="passed">Passed Only</option>
                <option value="all">All Submissions</option>
              </select>
              <select className="form-select" value={selectedTpl} onChange={e => setSelectedTpl(e.target.value)} style={{ width: 200 }}>
                <option value="">Default Template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <button className="btn btn-secondary" onClick={loadSubmissions} disabled={loading}>Refresh</button>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading submissions...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No submissions found.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Trainee</th><th>Course / Quiz</th><th>Score</th><th>Status</th><th>Date</th><th>Certificate</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(sub => {
                      const name = sub.user
                        ? `${sub.user.first_name ?? ''} ${sub.user.last_name ?? ''}`.trim() || sub.user.username
                        : `User #${sub.user_id ?? sub.user}`;
                      const quizTitle = sub.quiz?.title ?? `Quiz #${sub.quiz_id ?? sub.quiz}`;
                      const date = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '—';
                      const pct  = typeof sub.percentage === 'number' ? sub.percentage.toFixed(1) : '—';
                      return (
                        <tr key={sub.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.user?.department ?? ''}</div>
                          </td>
                          <td style={{ maxWidth: 220 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quizTitle}</div>
                          </td>
                          <td><span style={{ fontWeight: 800, color: sub.passed ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pct}%</span></td>
                          <td><span className={`badge ${sub.passed ? 'badge-active' : 'badge-retired'}`}>{sub.passed ? 'Passed' : 'Failed'}</span></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{date}</td>
                          <td>
                            {!sub.passed ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not eligible</span>
                            ) : sub._cert_issued ? (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span className="badge badge-active">Issued #{sub._cert_id}</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(sub._cert_id, 'pdf')}>PDF</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(sub._cert_id, 'png')}>PNG</button>
                              </div>
                            ) : (
                              <button className="btn btn-primary btn-sm" disabled={certLoading}
                                onClick={() => handleIssue(sub.id, name, quizTitle)}>
                                {certLoading ? 'Issuing...' : 'Issue Certificate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: CERTIFICATE TEMPLATES ── */}
      {activeTab === 'templates' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openNewTemplate}>+ New Template</button>
          </div>

          {tplSuccess && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--accent-green)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, color: 'var(--accent-green)' }}>{tplSuccess}</div>}

          {templates.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No templates yet. Click "New Template" to create one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {templates.map(t => (
                <div key={t.id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {t.theme} • {t.layout} • by {t.created_by_name || 'Unknown'}
                      </div>
                    </div>
                    <span className="badge badge-active">Active</span>
                  </div>
                  {t.company_name && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{t.company_name}</div>}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>
                    "{t.heading_text}"
                  </div>
                  {t.trainer_name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                      Signed by: {t.trainer_name} ({t.trainer_title})
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditTemplate(t)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteTpl(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Template Form Modal */}
          {editingTpl !== null && (
            <div className="modal-overlay" onClick={() => setEditingTpl(null)}>
              <div className="modal-content" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{editingTpl?.id ? 'Edit Template' : 'New Certificate Template'}</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingTpl(null)}>✕</button>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {tplError && <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>{tplError}</div>}

                  {[
                    ['title',        'Template Name *',       'text'],
                    ['company_name', 'Company Name',          'text'],
                    ['heading_text', 'Certificate Heading',   'text'],
                    ['sub_heading',  'Sub-heading',           'text'],
                    ['trainer_name', 'Trainer / Signatory Name', 'text'],
                    ['trainer_title','Signatory Title',       'text'],
                  ].map(([field, label, type]) => (
                    <div key={field} className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">{label}</label>
                      <input className="form-input" type={type} value={tplForm[field] ?? ''}
                        onChange={e => setTplForm(p => ({ ...p, [field]: e.target.value }))} />
                    </div>
                  ))}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Body Text (use {'{{employee_name}}'}, {'{{course_name}}'}, {'{{date}}'})</label>
                    <textarea className="form-textarea" rows={3} value={tplForm.body_text ?? ''}
                      onChange={e => setTplForm(p => ({ ...p, body_text: e.target.value }))} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Footer Text</label>
                    <input className="form-input" value={tplForm.footer_text ?? ''}
                      onChange={e => setTplForm(p => ({ ...p, footer_text: e.target.value }))} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Theme</label>
                      <select className="form-select" value={tplForm.theme ?? 'corporate_blue'}
                        onChange={e => setTplForm(p => ({ ...p, theme: e.target.value }))}>
                        {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Layout</label>
                      <select className="form-select" value={tplForm.layout ?? 'landscape'}
                        onChange={e => setTplForm(p => ({ ...p, layout: e.target.value }))}>
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Validity (days, 0=none)</label>
                      <input className="form-input" type="number" min="0" value={tplForm.validity_days ?? 0}
                        onChange={e => setTplForm(p => ({ ...p, validity_days: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Company Logo (optional)</label>
                      <input type="file" accept="image/*" className="form-input"
                        onChange={e => setTplForm(p => ({ ...p, company_logo: e.target.files[0] }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Trainer Signature (optional)</label>
                      <input type="file" accept="image/*" className="form-input"
                        onChange={e => setTplForm(p => ({ ...p, trainer_signature: e.target.files[0] }))} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingTpl(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveTpl} disabled={tplLoading}>
                    {tplLoading ? 'Saving...' : editingTpl?.id ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
