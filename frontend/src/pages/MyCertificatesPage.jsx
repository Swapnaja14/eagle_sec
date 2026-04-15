import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MY_CERTS = [
  { id: 'CERT-001', module: 'PSARA Foundation Course', issueDate: '2026-03-20', expiryDate: '2027-03-20', score: 88, trainer: 'Rajesh Kumar', certId: 'LS-PSARA-2026-0042', status: 'valid' },
  { id: 'CERT-002', module: 'Fire Safety & Evacuation', issueDate: '2026-02-14', expiryDate: '2027-02-14', score: 92, trainer: 'Priya Sharma', certId: 'LS-FIRE-2026-0018', status: 'valid' },
  { id: 'CERT-003', module: 'Emergency Response Protocol', issueDate: '2025-08-10', expiryDate: '2026-08-10', score: 74, trainer: 'Amit Patel', certId: 'LS-ERP-2025-0091', status: 'valid' },
];

function CertificateCard({ cert, user, expanded, onToggle }) {
  const isExpired = new Date(cert.expiryDate) < new Date();
  return (
    <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ width: 48, height: 48, background: 'rgba(59,130,246,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 3 }}>{cert.module}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Issued: {new Date(cert.issueDate).toLocaleDateString()} • Score: <strong style={{ color: 'var(--accent-green)' }}>{cert.score}%</strong></div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 16 }}>
          <div style={{ fontSize: '0.78rem', color: !isExpired ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
            {isExpired ? '⚠️ Expired' : '✓ Valid'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</div>
        </div>
        <div style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
          </svg>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0 24px 24px' }}>
          {/* Certificate Preview */}
          <div style={{
            margin: '20px 0', padding: '32px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border: '2px solid var(--accent-blue)', borderRadius: 14,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative corners */}
            <div style={{ position: 'absolute', top: 12, left: 12, width: 40, height: 40, border: '2px solid rgba(59,130,246,0.4)', borderRight: 'none', borderBottom: 'none', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, border: '2px solid rgba(59,130,246,0.4)', borderLeft: 'none', borderBottom: 'none', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 12, width: 40, height: 40, border: '2px solid rgba(59,130,246,0.4)', borderRight: 'none', borderTop: 'none', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, border: '2px solid rgba(59,130,246,0.4)', borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 4px 0' }} />

            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛡️</div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: 8 }}>CERTIFICATE OF COMPLETION</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 6 }}>This certifies that</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>has successfully completed</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 16 }}>{cert.module}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              <div><div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Score</div>{cert.score}%</div>
              <div><div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Trainer</div>{cert.trainer}</div>
              <div><div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Date</div>{new Date(cert.issueDate).toLocaleDateString()}</div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Certificate ID: {cert.certId} • LearnSphere
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => alert('PDF download (mock)')}>📥 Download PDF</button>
            <button className="btn btn-secondary" onClick={() => alert('PNG download (mock)')}>🖼️ Download PNG</button>
            <button className="btn btn-primary" onClick={() => alert('Share link copied!')}>🔗 Share Link</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyCertificatesPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);

  const validCerts = MY_CERTS.filter(c => new Date(c.expiryDate) >= new Date()).length;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>My Certificates 🎓</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Certificates you've earned. Click to preview and download.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Certificates', value: MY_CERTS.length, color: 'var(--accent-blue)' },
          { label: 'Currently Valid', value: validCerts, color: 'var(--accent-green)' },
          { label: 'Expiring / Expired', value: MY_CERTS.length - validCerts, color: MY_CERTS.length - validCerts > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div>
        {MY_CERTS.map(cert => (
          <CertificateCard
            key={cert.id}
            cert={cert}
            user={user}
            expanded={expanded === cert.id}
            onToggle={() => setExpanded(prev => prev === cert.id ? null : cert.id)}
          />
        ))}
      </div>

      {MY_CERTS.length === 0 && (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <h3 style={{ color: 'var(--text-primary)' }}>No certificates yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Complete a training module and pass the assessment to earn your first certificate.</p>
        </div>
      )}
    </div>
  );
}
