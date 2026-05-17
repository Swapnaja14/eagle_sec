import React, { useState, useRef } from 'react';
import { bulkUploadAPI } from '../services/api';

const TEMPLATE_HEADERS = [
  'Employee ID',
  'First Name',
  'Last Name',
  'Email',
  'Department',
  'Designation',
  'Client',
  'Site',
  'Role',
];

export default function BulkUserUploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const f = e.dataTransfer.files[0];

    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      handleFileUpload(f);
    } else {
      setError('Invalid file format. Please upload a CSV or XLSX file.');
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];

    if (f) {
      handleFileUpload(f);
    }
  };

  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setError('');
    setProcessing(true);
    setPreview(null);

    try {
      const { data } = await bulkUploadAPI.preview(uploadedFile);

      const transformedPreview = data.preview.map((row) => ({
        employeeId: row.employee_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        department: row.department,
        designation: row.designation,
        client: row.client_name,
        site: row.site_name,
        role: row.role,
        status: row.status,
        errorMsg: row.errors?.join(', '),
        _original: row,
      }));

      setPreview({
        rows: transformedPreview,
        totalRows: data.total_rows,
        validCount: data.valid_count,
        errorCount: data.error_count,
        fileName: data.file_name,
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.errors?.[0] ||
        'Error processing file. Please check the format and try again.';

      setError(errorMsg);
      setFile(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!preview || preview.validCount === 0) return;

    setUploading(true);
    setError('');

    try {
      const validRows = preview.rows
        .filter((row) => row.status === 'valid')
        .map((row) => row._original);

      const { data } = await bulkUploadAPI.create(validRows);

      setUploadResult({
        createdCount: data.created_count,
        skippedCount: data.skipped_count,
        errors: data.errors || [],
        message: data.message,
      });

      setUploadDone(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        'Error creating users. Please try again.';

      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await bulkUploadAPI.downloadTemplate();

      const url = window.URL.createObjectURL(new Blob([data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_user_upload_template.csv');

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error downloading template. Please try again.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setUploadDone(false);
    setUploadResult(null);
    setError('');
  };

  if (uploadDone) {
    return (
      <div
        style={{
          padding: '80px 24px',
          maxWidth: 600,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>

        <h2
          style={{
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Upload Complete!
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: 24,
          }}
        >
          {uploadResult?.message ||
            `${uploadResult?.createdCount || 0} users created successfully.`}
        </p>

        {uploadResult?.errors && uploadResult.errors.length > 0 && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '16px',
              marginBottom: 24,
              textAlign: 'left',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--accent-red)',
                marginBottom: 8,
              }}
            >
              Errors:
            </div>

            {uploadResult.errors.map((err, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 4,
                }}
              >
                • {err}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <button className="btn btn-primary" onClick={handleReset}>
            Upload Another File
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => (window.location.href = '/admin/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '32px 24px',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 6px',
          }}
        >
          Bulk User Upload
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            margin: 0,
          }}
        >
          Upload a CSV or Excel file to create multiple users at once.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '12px 20px',
            marginBottom: 20,
            color: 'var(--accent-red)',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          background: 'rgba(59,130,246,0.06)',
          borderColor: 'rgba(59,130,246,0.3)',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: 'var(--accent-blue)',
            marginBottom: 8,
          }}
        >
          📋 Required Column Headers (CSV format)
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {TEMPLATE_HEADERS.map((h) => (
            <span key={h} className="chip">
              {h}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadTemplate}
          >
            ⬇️ Download Template CSV
          </button>
        </div>
      </div>

      {!file && !processing && (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            marginBottom: 24,
            border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-color)'
              }`,
            background: dragOver
              ? 'rgba(59,130,246,0.05)'
              : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>

          <h3
            style={{
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}
          >
            Drag & drop your CSV or Excel file
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              margin: '0 0 16px',
            }}
          >
            or click to browse
          </p>

          <button className="btn btn-secondary">Browse File</button>
        </div>
      )}

      {processing && (
        <div
          className="card"
          style={{
            padding: '40px',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          <div
            className="spinner"
            style={{
              width: 40,
              height: 40,
              margin: '0 auto 16px',
            }}
          />

          <div style={{ color: 'var(--text-secondary)' }}>
            Processing file...
          </div>
        </div>
      )}

      {preview && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div
              className="card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                minWidth: 160,
              }}
            >
              <span
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--accent-blue)',
                  fontWeight: 900,
                }}
              >
                {preview.totalRows}
              </span>

              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Total Rows
              </span>
            </div>

            <div
              className="card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                minWidth: 160,
                borderColor: 'rgba(34,197,94,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--accent-green)',
                  fontWeight: 900,
                }}
              >
                {preview.validCount}
              </span>

              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Valid
              </span>
            </div>

            <div
              className="card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                minWidth: 160,
                borderColor: 'rgba(239,68,68,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--accent-red)',
                  fontWeight: 900,
                }}
              >
                {preview.errorCount}
              </span>

              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                Errors
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Preview — {preview.fileName}
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
            >
              ✕ Remove
            </button>
          </div>

          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
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
                  {preview.rows.map((row, i) => (
                    <tr
                      key={i}
                      style={{
                        background:
                          row.status === 'error'
                            ? 'rgba(239,68,68,0.04)'
                            : undefined,
                      }}
                    >
                      <td>
                        <span style={{ fontSize: '1.1rem' }}>
                          {row.status === 'valid' ? '✅' : '❌'}
                        </span>
                      </td>

                      <td
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {row.employeeId}
                      </td>

                      <td>
                        {row.firstName} {row.lastName}
                      </td>

                      <td
                        style={{
                          color: row.email
                            ? 'var(--text-secondary)'
                            : 'var(--accent-red)',
                        }}
                      >
                        {row.email || '—'}
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {row.department}
                      </td>

                      <td style={{ color: 'var(--text-secondary)' }}>
                        {row.site}
                      </td>

                      <td>
                        <span
                          className={`badge ${row.role === 'instructor'
                              ? 'badge-draft'
                              : 'badge-archived'
                            }`}
                        >
                          {row.role === 'instructor'
                            ? 'trainer'
                            : row.role}
                        </span>
                      </td>

                      <td
                        style={{
                          color: 'var(--accent-red)',
                          fontSize: '0.82rem',
                        }}
                      >
                        {row.errorMsg || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {preview.errorCount > 0 && (
            <div
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 10,
                padding: '12px 20px',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  color: 'var(--accent-yellow)',
                  fontWeight: 700,
                }}
              >
                ⚠️ {preview.errorCount} rows have errors and will be skipped
                during upload. Fix the file and re-upload, or proceed to import
                only valid rows.
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button className="btn btn-ghost" onClick={handleReset}>
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || preview.validCount === 0}
            >
              {uploading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 16, height: 16 }}
                  />{' '}
                  Uploading...
                </>
              ) : (
                `Import ${preview.validCount} Valid Users`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}