import React, { useState, useEffect } from 'react';
import { rbacAPI } from '../services/api';

const ROLES = ['superadmin', 'admin', 'instructor', 'trainee'];
const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin / Manager',
  instructor: 'Trainer',
  trainee: 'Trainee / Guard',
};

const MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'training_history', label: 'Training History' },
  { id: 'psara', label: 'PSARA Compliance' },
  { id: 'calendar', label: 'Training Calendar' },
  { id: 'scheduler', label: 'Session Scheduler' },
  { id: 'course_builder', label: 'Course Builder' },
  { id: 'content_hub', label: 'Content Hub' },
  { id: 'question_bank', label: 'Question Bank' },
  { id: 'quiz_results', label: 'Quiz Results' },
  { id: 'analytics', label: 'Analytics Reports' },
  { id: 'bulk_export', label: 'Bulk Export' },
  { id: 'rbac', label: 'RBAC Management' },
  { id: 'sites', label: 'Site Management' },
  { id: 'bulk_users', label: 'Bulk User Upload' },
];

// Default permissions used as fallback when DB has no record yet
const DEFAULT_PERMISSIONS = {
  superadmin: { dashboard: true, training_history: true, psara: true, calendar: true, scheduler: true, course_builder: true, content_hub: true, question_bank: true, quiz_results: true, analytics: true, bulk_export: true, rbac: true, sites: true, bulk_users: true },
  admin: { dashboard: true, training_history: true, psara: true, calendar: true, scheduler: true, course_builder: false, content_hub: true, question_bank: false, quiz_results: true, analytics: true, bulk_export: true, rbac: false, sites: true, bulk_users: true },
  instructor: { dashboard: true, training_history: false, psara: false, calendar: true, scheduler: true, course_builder: true, content_hub: true, question_bank: true, quiz_results: true, analytics: false, bulk_export: false, rbac: false, sites: false, bulk_users: false },
  trainee: { dashboard: true, training_history: false, psara: false, calendar: true, scheduler: false, course_builder: false, content_hub: false, question_bank: false, quiz_results: false, analytics: false, bulk_export: false, rbac: false, sites: false, bulk_users: false },
};

export default function RBACManagementPage() {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingChange, setPendingChange] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matrixRes, histRes] = await Promise.all([
        rbacAPI.list(),
        rbacAPI.history(),
      ]);

      // Backend returns: { permissions: [...], matrix: { role: { code: bool } }, roles: [...] }
      // Transform to frontend format: { role: { module_id: bool } }
      const backendMatrix = matrixRes.data.matrix || {};
      const merged = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

      // Merge backend matrix into defaults
      for (const role of Object.keys(backendMatrix)) {
        if (merged[role]) {
          for (const permCode of Object.keys(backendMatrix[role])) {
            merged[role][permCode] = backendMatrix[role][permCode];
          }
        }
      }

      setPermissions(merged);

      // Transform history data
      // Backend returns: { history: [...], total: N }
      const historyData = histRes.data.history || histRes.data || [];
      const transformedHistory = historyData.map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        changed_by_name: h.changed_by_name || h.changed_by_display,
        role_affected: h.role,
        module_name: h.permission_name,
        from_access: h.previous_value,
        to_access: h.new_value,
        reason: h.reason,
      }));

      setHistory(transformedHistory);
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
      setError('Failed to load permissions. Showing defaults.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role, moduleId) => {
    if (role === 'superadmin') return;
    const newVal = !permissions[role][moduleId];
    setPendingChange({ role, moduleId, newVal });
    setReasonText('');
    setReasonError('');
  };

  const confirmChange = async () => {
    if (!reasonText.trim()) { setReasonError('Reason is required for RBAC changes.'); return; }
    const { role, moduleId, newVal } = pendingChange;
    setSaving(true);
    try {
      await rbacAPI.update({ role, module_id: moduleId, has_access: newVal, reason: reasonText });
      setPermissions(prev => ({ ...prev, [role]: { ...prev[role], [moduleId]: newVal } }));
      // Refresh history
      const histRes = await rbacAPI.history();
      const historyData = histRes.data.history || histRes.data || [];
      const transformedHistory = historyData.map(h => ({
        id: h.id,
        timestamp: h.timestamp,
        changed_by_name: h.changed_by_name || h.changed_by_display,
        role_affected: h.role,
        module_name: h.permission_name,
        from_access: h.previous_value,
        to_access: h.new_value,
        reason: h.reason,
      }));
      setHistory(transformedHistory);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save permission:', err);
      setError(err.response?.data?.detail || 'Failed to save permission change.');
    } finally {
      setSaving(false);
      setPendingChange(null);
      setReasonText('');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading permissions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>RBAC Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Role-Based Access Control — configure module permissions per role. All changes are logged.</p>
        </div>
        {saved && <div style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.3)', padding: '8px 18px', borderRadius: 8, fontWeight: 700 }}>✓ Changes saved</div>}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: 600, fontSize: '0.9rem' }}>Super Admin permissions cannot be modified. All RBAC changes require a logged reason.</span>
      </div>

      {/* Permission Matrix */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--text-primary)' }}>Permission Matrix</div>
        <table className="data-table" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 200 }}>Module</th>
              {ROLES.map(role => (
                <th key={role} style={{ textAlign: 'center', minWidth: 130 }}>
                  <div style={{ color: role === 'superadmin' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{ROLE_LABELS[role]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => (
              <tr key={mod.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</td>
                {ROLES.map(role => {
                  const hasAccess = permissions[role]?.[mod.id] ?? false;
                  const isLocked = role === 'superadmin';
                  return (
                    <td key={role} style={{ textAlign: 'center' }}>
                      <label className="toggle" style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.7 : 1 }}>
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
              {history.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No history yet.</td></tr>
              )}
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(h.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.changed_by_name}</td>
                  <td>{ROLE_LABELS[h.role_affected] || h.role_affected}</td>
                  <td>{h.module_name}</td>
                  <td>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>{h.from_access ? '✓' : '✗'}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{h.to_access ? '✓' : '✗'}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
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
                for role: <strong style={{ color: 'var(--accent-blue)' }}>{ROLE_LABELS[pendingChange.role]}</strong>.
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
              <button className={`btn ${pendingChange.newVal ? 'btn-primary' : 'btn-danger'}`} onClick={confirmChange} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
