import React, { useState, useEffect } from 'react';
import { clientsAPI, sitesAPI, departmentsAPI, analyticsAPI, certificatesAPI } from '../services/api';
import api from '../services/api';
import './EmployeeHistoryPage.css';

export default function EmployeeHistoryPage() {
  const [records,     setRecords]     = useState([]);
  const [clients,     setClients]     = useState([]);
  const [sites,       setSites]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [page,        setPage]        = useState(1);
  const pageSize = 25;

  const [filters, setFilters] = useState({
    clientId: '', siteId: '', department: '',
    search: '', dateFrom: '', dateTo: '', status: 'all',
  });

  // Load dropdown options
  useEffect(() => {
    clientsAPI.list().then(r => setClients(r.data?.results ?? r.data ?? [])).catch(() => {});
    sitesAPI.list().then(r => setSites(r.data?.results ?? r.data ?? [])).catch(() => {});
    departmentsAPI.list().then(r => setDepartments(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  // Load submissions as training records
  const loadRecords = async () => {
    setLoading(true); setError('');
    try {
      const params = { page_size: 500 };
      if (filters.department) params.department = filters.department;
      const res = await api.get('/assessments/submissions/', { params });
      setRecords(res.data?.results ?? res.data ?? []);
      setPage(1);
    } catch (e) {
      setError('Failed to load records: ' + (e.response?.data?.detail ?? e.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { loadRecords(); }, []);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDownloadCert = async (submissionId) => {
    try {
      // Check if cert exists for this submission
      const subRes = await api.get(`/assessments/submissions/${submissionId}/`);
      const sub = subRes.data;
      if (sub.certificate) {
        const res = await certificatesAPI.downloadPdf(sub.certificate.id);
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a'); a.href = url; a.download = `certificate_${submissionId}.pdf`; a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('No certificate issued for this submission yet. Go to Certificate Issuing to generate one.');
      }
    } catch { alert('Certificate download failed.'); }
  };

  const handleExportPdf = async () => {
    try {
      const res = await analyticsAPI.report();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `training_history_${new Date().toISOString().slice(0,10)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
  };

  // Client-side filtering on loaded records
  const filtered = records.filter(r => {
    const name = `${r.user?.first_name ?? ''} ${r.user?.last_name ?? ''} ${r.user?.username ?? ''}`.toLowerCase();
    const dept = r.user?.department?.toLowerCase() ?? '';
    if (filters.search && !name.includes(filters.search.toLowerCase())) return false;
    if (filters.department && dept !== filters.department.toLowerCase()) return false;
    if (filters.status !== 'all') {
      if (filters.status === 'passed' && !r.passed) return false;
      if (filters.status === 'failed' && (r.passed || r.status !== 'completed')) return false;
      if (filters.status === 'in_progress' && r.status !== 'in_progress') return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="history-page">
      <div className="page-header">
        <h1 className="page-title">Employee Training History</h1>
        <p className="page-subtitle">Comprehensive log of all completed training modules and assessment scores.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" name="clientId" value={filters.clientId} onChange={handleFilterChange}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <select className="form-select" name="siteId" value={filters.siteId} onChange={handleFilterChange}>
              <option value="">All Sites</option>
              {(filters.clientId ? sites.filter(s => String(s.client_id ?? s.client ?? '') === String(filters.clientId)) : sites)
                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" name="department" value={filters.department} onChange={handleFilterChange}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Employee Name or ID</label>
            <input className="form-input" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search..." />
          </div>
        </div>
        <div className="filter-actions">
          <div className="type-filters">
            {[['all','All'],['passed','Passed'],['failed','Failed'],['in_progress','In Progress']].map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input type="radio" name="status" value={val} checked={filters.status === val} onChange={handleFilterChange} />
                {label}
              </label>
            ))}
          </div>
          <button className="btn btn-primary" onClick={loadRecords} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--accent-red)', padding: '12px 0' }}>{error}</div>}

      <div className="table-container">
        <div className="table-summary">
          <span>Showing {filtered.length} records</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Quiz / Module</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((record, i) => {
                  const name = record.user
                    ? `${record.user.first_name ?? ''} ${record.user.last_name ?? ''}`.trim() || record.user.username
                    : `User #${record.user_id ?? record.user}`;
                  const quizTitle = record.quiz?.title ?? `Quiz #${record.quiz_id ?? record.quiz}`;
                  const date = record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : '—';
                  const pct = typeof record.percentage === 'number' ? record.percentage.toFixed(1) : null;

                  return (
                    <tr key={record.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * pageSize + i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.user?.username}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{record.user?.department || '—'}</td>
                      <td style={{ fontWeight: 500 }}>{quizTitle}</td>
                      <td>
                        {pct !== null ? (
                          <span style={{
                            fontWeight: 700,
                            color: record.passed ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}>{pct}%</span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${record.passed ? 'active' : record.status === 'in_progress' ? 'draft' : 'retired'}`}>
                          {record.passed ? 'Passed' : record.status === 'in_progress' ? 'In Progress' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {record.passed && (
                            <button className="btn btn-ghost btn-sm" title="Download Certificate"
                              onClick={() => handleDownloadCert(record.id)}>📜</button>
                          )}
                          {!record.passed && record.status === 'completed' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No cert</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      No training records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer">
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
          <div className="export-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}>Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
