import React, { useState } from 'react';

const ROLES = ['Super Admin', 'Admin / Manager', 'Trainer', 'Trainee / Guard'];
const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'training_history', label: 'Training History' },
  { id: 'calendar', label: 'Training Calendar' },
  { id: 'scheduler', label: 'Session Scheduler' },
  { id: 'course_builder', label: 'Course Builder' },
  { id: 'content_hub', label: 'Content Hub' },
  { id: 'question_bank', label: 'Question Bank' },
  { id: 'quiz_results', label: 'Quiz Results' },
  { id: 'analytics', label: 'Analytics Reports' },
  { id: 'certificates', label: 'Certificate Issuing' },
  { id: 'bulk_export', label: 'Bulk Export' },
  { id: 'rbac', label: 'RBAC Management' },
  { id: 'sites', label: 'Site Management' },
  { id: 'bulk_users', label: 'Bulk User Upload' },
];

const DEFAULT_PERMISSIONS = {
  'Super Admin':    { dashboard: true,  training_history: true,  calendar: true,  scheduler: true,  course_builder: true,  content_hub: true,  question_bank: true,  quiz_results: true,  analytics: true,  certificates: true,  bulk_export: true,  rbac: true,  sites: true,  bulk_users: true  },
  'Admin / Manager':{ dashboard: true,  training_history: true,  calendar: true,  scheduler: true,  course_builder: false, content_hub: true,  question_bank: false, quiz_results: true,  analytics: true,  certificates: true,  bulk_export: true,  rbac: false, sites: true,  bulk_users: true  },
  'Trainer':        { dashboard: true,  training_history: false, calendar: true,  scheduler: true,  course_builder: true,  content_hub: true,  question_bank: true,  quiz_results: true,  analytics: false, certificates: true,  bulk_export: false, rbac: false, sites: false, bulk_users: false },
  'Trainee / Guard':{ dashboard: true,  training_history: false, calendar: true,  scheduler: false, course_builder: false, content_hub: false, question_bank: false, quiz_results: false, analytics: false, certificates: false, bulk_export: false, rbac: false, sites: false, bulk_users: false },
};

const MOCK_HISTORY = [
  { id: 1, changedBy: 'Super Admin', role: 'Trainer', module: 'Analytics Reports', from: false, to: true, reason: 'Trainer needs access for performance review', timestamp: '2026-04-14 14:32:10' },
  { id: 2, changedBy: 'Super Admin', role: 'Admin / Manager', module: 'RBAC Management', from: true, to: false, reason: 'Security policy — RBAC restricted to Super Admin only', timestamp: '2026-04-13 09:15:44' },
  { id: 3, changedBy: 'Super Admin', role: 'Trainer', module: 'Course Builder', from: false, to: true, reason: 'Trainer promotion — content authoring enabled', timestamp: '2026-04-10 11:00:00' },
];

export default function RBACManagementPage() {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [pendingChange, setPendingChange] = useState(null); // { role, moduleId, newVal }
  const [reasonText, setReasonText] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [saved, setSaved] = useState(false);

  const togglePermission = (role, moduleId) => {
    if (role === 'Super Admin') return; // Super Admin is immutable
    const newVal = !permissions[role][moduleId];
    setPendingChange({ role, moduleId, newVal });
    setReasonText('');
    setReasonError('');
  };

  const confirmChange = () => {
    if (!reasonText.trim()) { setReasonError('Reason is required for RBAC changes.'); return; }
    const { role, moduleId, newVal } = pendingChange;
    setPermissions(prev => ({ ...prev, [role]: { ...prev[role], [moduleId]: newVal } }));
    const moduleName = MODULES.find(m => m.id === moduleId)?.label || moduleId;
    setHistory(prev => [{
      id: prev.length + 1, changedBy: 'Admin', role, module: moduleName,
      from: !newVal, to: newVal, reason: reasonText,
      timestamp: new Date().toLocaleString(),
    }, ...prev]);
    setPendingChange(null);
    setReasonText('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>RBAC Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Role-Based Access Control — configure module permissions per role. All changes are logged.</p>
        </div>
        {saved && <div style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.3)', padding: '8px 18px', borderRadius: 8, fontWeight: 700 }}>✓ Changes saved</div>}
      </div>

      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: 600, fontSize: '0.9rem' }}>Super Admin permissions cannot be modified. All RBAC changes require a logged reason.</span>
      </div>

      {/* Permission Matrix */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-primary)' }}>
          Permission Matrix
        </div>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 200 }}>Module</th>
              {ROLES.map(role => (
                <th key={role} style={{ textAlign: 'center', minWidth: 130 }}>
                  <div style={{ color: role === 'Super Admin' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{role}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => (
              <tr key={mod.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</td>
                {ROLES.map(role => {
                  const hasAccess = permissions[role][mod.id];
                  const isLocked = role === 'Super Admin';
                  return (
                    <td key={role} style={{ textAlign: 'center' }}>
                      <label className={`toggle ${isLocked ? '' : ''}`} style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.7 : 1 }}>
                        <input
                          type="checkbox"
                          checked={hasAccess}
                          onChange={() => !isLocked && togglePermission(role, mod.id)}
                          disabled={isLocked}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Override History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>Override History Log</div>
          <span className="badge badge-draft">{history.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Changed By</th>
                <th>Role Affected</th>
                <th>Module</th>
                <th>Change</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{h.timestamp}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.changedBy}</td>
                  <td>{h.role}</td>
                  <td>{h.module}</td>
                  <td>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{h.from ? '✓' : '✗'}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{h.to ? '✓' : '✗'}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Confirmation Modal */}
      {pendingChange && (
        <div className="modal-overlay" onClick={() => setPendingChange(null)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Confirm Permission Change</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPendingChange(null)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                You are about to <strong style={{ color: pendingChange.newVal ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pendingChange.newVal ? 'GRANT' : 'REVOKE'}</strong>{' '}
                access to <strong style={{ color: 'var(--text-primary)' }}>{MODULES.find(m => m.id === pendingChange.moduleId)?.label}</strong>{' '}
                for role: <strong style={{ color: 'var(--accent-blue)' }}>{pendingChange.role}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Reason for Change *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={reasonText}
                  onChange={e => { setReasonText(e.target.value); setReasonError(''); }}
                  placeholder="Document the reason for this permission change..."
                  style={{ width: '100%' }}
                />
                {reasonError && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '4px 0 0' }}>{reasonError}</p>}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => setPendingChange(null)}>Cancel</button>
              <button className={`btn ${pendingChange.newVal ? 'btn-primary' : 'btn-danger'}`} onClick={confirmChange}>
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
