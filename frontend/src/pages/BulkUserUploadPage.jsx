import React, { useState, useRef } from 'react';

const TEMPLATE_HEADERS = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Client', 'Site', 'Role'];

const MOCK_PREVIEW = [
  { employeeId: 'EMP-20001', firstName: 'Aakash', lastName: 'Mehta', email: 'aakash.m@secureguard.in', department: 'Security', designation: 'Guard', client: 'SecureGuard India', site: 'Mumbai HQ', role: 'trainee', status: 'valid' },
  { employeeId: 'EMP-20002', firstName: 'Bhavna', lastName: 'Patel', email: 'bhavna.p@secureguard.in', department: 'Housekeeping', designation: 'Supervisor', client: 'SecureGuard India', site: 'Delhi Office', role: 'trainee', status: 'valid' },
  { employeeId: 'EMP-20003', firstName: 'Chetan', lastName: 'Verma', email: '', department: 'Facility Management', designation: 'Manager', client: 'Sapphire Security', site: 'Pune Campus', role: 'trainer', status: 'error', errorMsg: 'Email is required' },
  { employeeId: 'EMP-20004', firstName: 'Divya', lastName: 'Rao', email: 'divya.r@rapidshield.co', department: 'IT', designation: 'Guard', client: 'RapidShield Corp', site: 'Bangalore Tech Park', role: 'trainee', status: 'valid' },
  { employeeId: 'EMP-20003', firstName: 'Duplicate', lastName: 'User', email: 'dup@test.com', department: 'Security', designation: 'Guard', client: 'SecureGuard India', site: 'Mumbai HQ', role: 'trainee', status: 'error', errorMsg: 'Duplicate Employee ID' },
];

export default function BulkUserUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
      setPreview(MOCK_PREVIEW); // Show mock preview
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(MOCK_PREVIEW); }
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploadDone(true); }, 2200);
  };

  const validCount = preview ? preview.filter(r => r.status === 'valid').length : 0;
  const errorCount = preview ? preview.filter(r => r.status === 'error').length : 0;

  if (uploadDone) {
    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Upload Complete!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{validCount} users created successfully. {errorCount} rows were skipped due to errors.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setFile(null); setPreview(null); setUploadDone(false); }}>Upload Another File</button>
          <button className="btn btn-secondary">View All Users</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Bulk User Upload</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Upload a CSV or Excel file to create multiple users at once.</p>
      </div>

      {/* Instructions */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 8 }}>📋 Required Column Headers</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMPLATE_HEADERS.map(h => (
            <span key={h} className="chip">{h}</span>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Template download (mock)')}>⬇️ Download Template CSV</button>
        </div>
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          className="card"
          style={{
            padding: '48px 24px', textAlign: 'center', marginBottom: 24,
            border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            background: dragOver ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current.click()}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display: 'none' }} onChange={handleFileSelect} />
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Drag & drop your CSV or Excel file</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>or click to browse</p>
          <button className="btn btn-secondary">Browse File</button>
        </div>
      )}

      {file && !preview && (
        <div className="card" style={{ padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: '2rem' }}>📄</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{file.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Parsing file...</div>
          </div>
        </div>
      )}

      {preview && (
        <>
          {/* Validation Summary */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--accent-blue)', fontWeight: 900 }}>{preview.length}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Rows</span>
            </div>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 160, borderColor: 'rgba(34,197,94,0.3)' }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--accent-green)', fontWeight: 900 }}>{validCount}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Valid</span>
            </div>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 160, borderColor: 'rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '1.5rem', color: 'var(--accent-red)', fontWeight: 900 }}>{errorCount}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Errors</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Preview — {file.name}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setPreview(null); }}>✕ Remove</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Site</th>
                    <th>Role</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ background: row.status === 'error' ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td>
                        <span style={{ fontSize: '1.1rem' }}>{row.status === 'valid' ? '✅' : '❌'}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.employeeId}</td>
                      <td>{row.firstName} {row.lastName}</td>
                      <td style={{ color: row.email ? 'var(--text-secondary)' : 'var(--accent-red)' }}>{row.email || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.department}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.site}</td>
                      <td>
                        <span className={`badge ${row.role === 'trainer' ? 'badge-draft' : 'badge-archived'}`}>{row.role}</span>
                      </td>
                      <td style={{ color: 'var(--accent-red)', fontSize: '0.82rem' }}>{row.errorMsg || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {errorCount > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 20 }}>
              <span style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>⚠️ {errorCount} rows have errors and will be skipped during upload. Fix the file and re-upload, or proceed to import only valid rows.</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || validCount === 0}>
              {uploading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</> : `Import ${validCount} Valid Users`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
