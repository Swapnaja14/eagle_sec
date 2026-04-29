import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { certificatesAPI } from '../services/api';

function CertificateCard({ cert, user, expanded, onToggle, onDownloadPdf, onDownloadPng }) {
  const isExpired = cert.expires_at && new Date(cert.expires_at) < new Date();
  const issueDate = cert.issued_at ? new Date(cert.issued_at) : null;
  const expiryDate = cert.expires_at ? new Date(cert.expires_at) : null;

  return (
    <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ width: 48, height: 48, background: 'rgba(59,130,246,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 3 }}>{cert.course_title}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Issued: {issueDate ? issueDate.toLocaleDateString() : '—'}
            {cert.submission?.percentage != null && (
              <> • Score: <strong style={{ color: 'var(--accent-green)' }}>{cert.submission.percentage?.toFixed(1)}%</strong></>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 16 }}>
          <div style={{ fontSize: '0.78rem', color: !isExpired ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
            {isExpired ? '⚠️ Expired' : '✓ Valid'}
          </div>
          {expiryDate && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Expires: {expiryDate.toLocaleDateString()}
            </div>
          )}
        </div>
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"
          style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0 24px 24px' }}>
          {/* Certificate Preview */}
          <div style={{
            margin: '20px 0', padding: '32px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border: '2px solid var(--accent-blue)', borderRadius: 14, position: 'relative', overflow: 'hidden',
          }}>
            {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
              <div key={`${v}${h}`} style={{
                position: 'absolute', [v]: 12, [h]: 12, width: 40, height: 40,
                border: '2px solid rgba(59,130,246,0.4)',
                borderRight: h === 'left' ? 'none' : undefined,
                borderLeft: h === 'right' ? 'none' : undefined,
                borderBottom: v === 'top' ? 'none' : undefined,
                borderTop: v === 'bottom' ? 'none' : undefined,
                borderRadius: v === 'top' && h === 'left' ? '4px 0 0 0' : v === 'top' && h === 'right' ? '0 4px 0 0' : v === 'bottom' && h === 'left' ? '0 0 0 4px' : '0 0 4px 0',
              }} />
            ))}
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛡️</div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 8 }}>CERTIFICATE OF COMPLETION</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 6 }}>This certifies that</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>has successfully completed</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 16 }}>{cert.course_title}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              <div><div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Date</div>{issueDate?.toLocaleDateString()}</div>
              {cert.template_name && <div><div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Template</div>{cert.template_name}</div>}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Certificate ID: #{cert.id} • LearnSphere
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => onDownloadPdf(cert.id)}>📥 Download PDF</button>
            <button className="btn btn-secondary" onClick={() => onDownloadPng(cert.id)}>🖼️ Download PNG</button>
            <button className="btn btn-primary" onClick={() => {
              navigator.clipboard?.writeText(cert.pdf_url || `${window.location.origin}/api/certificates/${cert.id}/download/pdf/`);
              alert('Download link copied to clipboard!');
            }}>🔗 Share Link</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyCertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await certificatesAPI.myCerts();
        setCerts(res.data ?? []);
      } catch (e) {
        setError('Failed to load certificates: ' + (e.response?.data?.detail ?? e.message));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadPdf = async (certId) => {
    try {
      const res = await certificatesAPI.downloadPdf(certId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `certificate_${certId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF download failed. The certificate file may not be generated yet.'); }
  };

  const handleDownloadPng = async (certId) => {
    try {
      const res = await certificatesAPI.downloadPng(certId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'image/png' }));
      const a = document.createElement('a'); a.href = url; a.download = `certificate_${certId}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PNG download failed. The certificate file may not be generated yet.'); }
  };

  const validCount   = certs.filter(c => !c.expires_at || new Date(c.expires_at) >= new Date()).length;
  const expiredCount = certs.length - validCount;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Certificates 🎓</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Certificates you've earned. Click to preview and download.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Certificates', value: loading ? '—' : certs.length, color: 'var(--accent-blue)' },
          { label: 'Currently Valid',    value: loading ? '—' : validCount,   color: 'var(--accent-green)' },
          { label: 'Expired',            value: loading ? '—' : expiredCount, color: expiredCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div style={{ color: 'var(--accent-red)', marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading certificates...</div>
      ) : certs.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <h3 style={{ color: 'var(--text-primary)' }}>No certificates yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Complete a training module and pass the assessment to earn your first certificate.</p>
        </div>
      ) : (
        certs.map(cert => (
          <CertificateCard
            key={cert.id} cert={cert} user={user}
            expanded={expanded === cert.id}
            onToggle={() => setExpanded(prev => prev === cert.id ? null : cert.id)}
            onDownloadPdf={handleDownloadPdf}
            onDownloadPng={handleDownloadPng}
          />
        ))
      )}
    </div>
  );
}
