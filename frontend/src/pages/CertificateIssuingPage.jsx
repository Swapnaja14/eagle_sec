import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TOOLTIP_STYLE = {
  backgroundColor: '#161b22', borderColor: '#30363d',
  color: '#f0f6fc', borderRadius: 8, fontSize: '0.85rem',
};

export default function CertificateIssuingPage() {
  const [submissions, setSubmissions]   = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [certLoading, setCertLoading]   = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('passed'); // passed | all
  const [activeTab, setActiveTab]       = useState('issue');  // issue | issued

  // Load passed submissions (eligible for certificate)
  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/assessments/submissions/', {
        params: { page_size: 200 },
      });
      const all = res.data?.results ?? res.data ?? [];
      setSubmissions(all);
    } catch (err) {
      setError('Failed to load submissions: ' + (err.response?.data?.detail ?? err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load already-issued certificates
  const loadCertificates = useCallback(async () => {
    try {
      const res = await api.get('/certificates/employee/0/', {});
      setCertificates([]);
    } catch {
      // endpoint returns 404 for id=0, use summary instead
    }
    // Fetch all via analytics summary approach - just show issued certs from submissions
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleIssueCertificate = async (submissionId, employeeName, courseName) => {
    setCertLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/certificates/generate/', { submission_id: submissionId });
      const cert = res.data;
      setSuccess(
        `Certificate #${cert.id} issued for ${employeeName} — ${courseName}. ` +
        `Download: /api/certificates/${cert.id}/download/`
      );
      // Mark this submission as certificated in local state
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, _cert_issued: true, _cert_id: cert.id } : s)
      );
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Failed to issue certificate.';
      setError(detail);
    } finally {
      setCertLoading(false);
    }
  };

  const handleDownload = async (certId) => {
    try {
      const res = await api.get(`/certificates/${certId}/download/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${certId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. The certificate file may not exist on disk yet.');
    }
  };

  // Filter submissions
  const filtered = submissions.filter(sub => {
    const matchStatus = filterStatus === 'all' || sub.passed;
    const name = `${sub.user?.username ?? ''} ${sub.quiz?.title ?? ''}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const passedCount  = submissions.filter(s => s.passed && s.status === 'completed').length;
  const failedCount  = submissions.filter(s => !s.passed && s.status === 'completed').length;
  const issuedCount  = submissions.filter(s => s._cert_issued).length;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1300, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Certificate Issuing
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Issue PDF certificates to trainees who passed their assessments.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadSubmissions} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Submissions', value: submissions.length, color: 'var(--accent-blue)' },
          { label: 'Passed',            value: passedCount,        color: 'var(--accent-green)' },
          { label: 'Failed',            value: failedCount,        color: 'var(--accent-red)' },
          { label: 'Certs Issued',      value: issuedCount,        color: 'var(--accent-cyan)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--accent-green)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: 'var(--accent-green)' }}>
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="Search by trainee or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="passed">Passed Only</option>
            <option value="all">All Submissions</option>
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading submissions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No {filterStatus === 'passed' ? 'passed ' : ''}submissions found.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Course / Quiz</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const name = sub.user
                    ? `${sub.user.first_name ?? ''} ${sub.user.last_name ?? ''}`.trim() || sub.user.username
                    : `User #${sub.user_id ?? sub.user}`;
                  const quizTitle = sub.quiz?.title ?? `Quiz #${sub.quiz_id ?? sub.quiz}`;
                  const date = sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleDateString()
                    : '—';
                  const pct = typeof sub.percentage === 'number' ? sub.percentage.toFixed(1) : '—';
                  const alreadyIssued = sub._cert_issued;

                  return (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sub.user?.department ?? ''}
                        </div>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {quizTitle}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 800,
                          color: sub.passed ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}>
                          {pct}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sub.passed ? 'badge-active' : 'badge-retired'}`}>
                          {sub.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{date}</td>
                      <td>
                        {!sub.passed ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Not eligible</span>
                        ) : alreadyIssued ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span className="badge badge-active">Issued #{sub._cert_id}</span>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDownload(sub._cert_id)}
                            >
                              Download
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={certLoading}
                            onClick={() => handleIssueCertificate(sub.id, name, quizTitle)}
                          >
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

      {/* Info box */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--accent-blue)' }}>How it works:</strong> Only trainees who passed their assessment (score &ge; passing threshold) are eligible.
        Clicking "Issue Certificate" generates a PDF and stores it. The trainee can then download it from their "My Certificates" page.
      </div>
    </div>
  );
}
