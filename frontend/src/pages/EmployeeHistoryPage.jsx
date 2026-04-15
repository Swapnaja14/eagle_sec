import React, { useState } from 'react';
import { mockTrainingRecords, mockClients, mockSites, mockDepartments } from '../data/mockData';
import './EmployeeHistoryPage.css';

export default function EmployeeHistoryPage() {
  const [filters, setFilters] = useState({
    clientId: mockClients[0].id,
    siteId: '',
    department: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    type: 'all'
  });

  const [page, setPage] = useState(1);
  const pageSize = 25;

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const filteredRecords = mockTrainingRecords.filter(record => {
    if (filters.clientId && record.clientId !== filters.clientId) return false;
    if (filters.siteId && record.siteId !== filters.siteId) return false;
    if (filters.department && record.department !== filters.department) return false;
    if (filters.search && !record.employeeName.toLowerCase().includes(filters.search.toLowerCase()) && 
        !record.employeeId.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type !== 'all' && record.trainingType !== filters.type) return false;
    return true;
  });

  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="history-page">
      <div className="page-header">
        <h1 className="page-title">Employee Training History</h1>
        <p className="page-subtitle">Comprehensive log of all completed training modules and assessment scores.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-grid">
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select className="form-select" name="clientId" value={filters.clientId} onChange={handleFilterChange}>
              {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Site</label>
            <select className="form-select" name="siteId" value={filters.siteId} onChange={handleFilterChange}>
              <option value="">All Sites</option>
              {mockSites.filter(s => s.clientId === filters.clientId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" name="department" value={filters.department} onChange={handleFilterChange}>
              <option value="">All Departments</option>
              {mockDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Employee Name or ID</label>
            <input className="form-input" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search..." />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Date From</label>
              <input type="date" className="form-input" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <div className="type-filters">
            {['all', 'classroom', 'virtual', 'self-paced'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input type="radio" name="type" value={type} checked={filters.type === type} onChange={handleFilterChange} />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
          <button className="btn btn-primary">Apply Filters</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-summary">
          <span>Showing {filteredRecords.length} records</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Dept/Designation</th>
                <th>Training Module</th>
                <th>Type</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Score</th>
                <th>Status</th>
                <th>PSARA Valid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length > 0 ? paginatedRecords.map((record, i) => (
                <tr key={record.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * pageSize + i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.employeeName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.employeeId}</div>
                  </td>
                  <td>
                    <div>{record.department}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{record.designation}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{record.moduleName}</td>
                  <td style={{ textTransform: 'capitalize' }}>{record.trainingType}</td>
                  <td>{new Date(record.sessionDate).toLocaleDateString()}</td>
                  <td>{record.durationMinutes}m</td>
                  <td>
                    {record.score !== null ? (
                      <span className="chip" style={{ 
                        background: record.score >= 80 ? 'rgba(34, 197, 94, 0.15)' : record.score >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: record.score >= 80 ? 'var(--accent-green)' : record.score >= 60 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                        borderColor: 'transparent'
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
                  <td>
                    {record.psaraValid ? (
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ✓ <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ✗ <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(record.psaraExpiryDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" title="View Profile">👁️</button>
                      {record.status === 'passed' && <button className="btn btn-ghost btn-sm" title="Download Certificate">📜</button>}
                      {(record.status === 'failed' || record.status === 'expired') && <button className="btn btn-ghost btn-sm" title="Re-assign">🔄</button>}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No training records found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {Math.max(1, Math.ceil(filteredRecords.length / pageSize))}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(filteredRecords.length / pageSize)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
          <div className="export-actions">
            <button className="btn btn-secondary btn-sm">Export Excel</button>
            <button className="btn btn-secondary btn-sm">Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
