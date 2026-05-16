import React, { useState, useRef } from 'react';
import { bulkUploadAPI } from '../services/api';

const TEMPLATE_HEADERS = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Role'];

export default function BulkUserUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
      setPreview(f.name);
      setError('');
    } else {
      setError('Only .csv or .xlsx files are supported.');
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.name.endsWith('.csv') || f.name.endsWith('.xlsx')) {
        setFile(f);
        setPreview(f.name);
        setError('');
      } else {
        setError('Only .csv or .xlsx files are supported.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await bulkUploadAPI.upload(formData);
      setUploadResults(res.data);
      setUploadDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  if (uploadDone && uploadResults) {
    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Upload Complete!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{uploadResults.created_count} users created successfully. {uploadResults.errors?.length || 0} rows were skipped due to errors.</p>
        
        {uploadResults.errors && uploadResults.errors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px', marginBottom: 24, textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
            <strong style={{ color: 'var(--accent-red)' }}>Errors:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {uploadResults.errors.map((e, i) => <li key={i} style={{ marginBottom: 4 }}>{e}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => { setFile(null); setPreview(null); setUploadDone(false); setUploadResults(null); }}>Upload Another File</button>
          <button className="btn btn-secondary" onClick={() => window.location.href='/rbac'}>View Users</button>
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

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Instructions */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 8 }}>📋 Required Column Headers (CSV format)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEMPLATE_HEADERS.map(h => (
            <span key={h} className="chip">{h}</span>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const csv = TEMPLATE_HEADERS.join(',') + '\nEMP-1001,John,Doe,john@example.com,Security,Trainee';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'user_upload_template.csv';
            a.click();
          }}>⬇️ Download Template CSV</button>
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

      {file && (
        <>
          <div className="card" style={{ padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '2rem' }}>📄</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{file.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(2)} KB</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => { setFile(null); setPreview(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading & Processing...</> : `Import Users`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
