import React, { useState, useEffect } from 'react';
import { sitesAPI, clientsAPI } from '../services/api';

const EMPTY_FORM = { name: '', client: '', address: '', city: '', state: '', country: 'India', postal_code: '' };

export default function SiteManagementPage() {
  const [sites,        setSites]        = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editSite,     setEditSite]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sitesRes, clientsRes] = await Promise.all([sitesAPI.list(), clientsAPI.list()]);
      setSites(sitesRes.data?.results ?? sitesRes.data ?? []);
      setClients(clientsRes.data?.results ?? clientsRes.data ?? []);
    } catch (e) {
      setError('Failed to load data: ' + (e.response?.data?.detail ?? e.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditSite(null); setShowModal(true); };
  const openEdit = (site) => {
    setForm({
      name: site.name || '', client: site.client_id ?? site.client ?? '',
      address: site.address || '', city: site.city || '',
      state: site.state || '', country: site.country || 'India',
      postal_code: site.postal_code || '',
    });
    setEditSite(site);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditSite(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Site name is required.'); return; }
    setSaving(true);
    try {
      if (editSite) {
        const res = await sitesAPI.update(editSite.id, form);
        setSites(prev => prev.map(s => s.id === editSite.id ? res.data : s));
      } else {
        const res = await sitesAPI.create(form);
        setSites(prev => [...prev, res.data]);
      }
      closeModal();
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.detail ?? JSON.stringify(e.response?.data) ?? e.message));
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (site) => {
    try {
      const res = await sitesAPI.update(site.id, { is_active: !site.is_active });
      setSites(prev => prev.map(s => s.id === site.id ? res.data : s));
    } catch { alert('Failed to update site status.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this site? This cannot be undone.')) return;
    try {
      await sitesAPI.delete(id);
      setSites(prev => prev.filter(s => s.id !== id));
    } catch { alert('Failed to delete site.'); }
  };

  const filtered = sites.filter(s => {
    const clientId = s.client_id ?? s.client ?? '';
    if (clientFilter && String(clientId) !== String(clientFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.city?.toLowerCase().includes(q) && !s.address?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const clientName = (site) => {
    const cid = site.client_id ?? site.client;
    return clients.find(c => c.id === cid)?.name ?? '—';
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Site Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage client deployment sites across locations.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add New Site</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Sites',    value: loading ? '—' : sites.length,                                    color: 'var(--accent-blue)' },
          { label: 'Active Sites',   value: loading ? '—' : sites.filter(s => s.is_active !== false).length, color: 'var(--accent-green)' },
          { label: 'Clients Served', value: loading ? '—' : new Set(sites.map(s => s.client_id ?? s.client)).size, color: 'var(--accent-cyan)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2, minWidth: 200, margin: 0 }}>
          <label className="form-label">Search</label>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Site name, city, address..." />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 160, margin: 0 }}>
          <label className="form-label">Client</label>
          <select className="form-select" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      {error && <div style={{ color: 'var(--accent-red)', marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading sites...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Site Name</th><th>Client</th><th>City</th><th>Address</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(site => (
                  <tr key={site.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      <span style={{ marginRight: 8 }}>📍</span>{site.name}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{clientName(site)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{site.city || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {site.address || '—'}
                    </td>
                    <td>
                      <span className={`badge ${site.is_active !== false ? 'badge-active' : 'badge-archived'}`}>
                        {site.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(site)}>✏️</button>
                        <button className="btn btn-ghost btn-sm" title={site.is_active !== false ? 'Deactivate' : 'Activate'}
                          style={{ color: site.is_active !== false ? 'var(--accent-yellow)' : 'var(--accent-green)' }}
                          onClick={() => handleToggleActive(site)}>
                          {site.is_active !== false ? '🚫' : '✅'}
                        </button>
                        <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: 'var(--accent-red)' }}
                          onClick={() => handleDelete(site.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sites found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {filtered.length} site{filtered.length !== 1 ? 's' : ''} shown
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{editSite ? `Edit: ${editSite.name}` : 'Add New Site'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['name',        'Site Name *',  'text',   'e.g. Mumbai South Hub'],
                ['address',     'Address',      'text',   'Street address'],
                ['city',        'City',         'text',   'e.g. Mumbai'],
                ['state',       'State',        'text',   'e.g. Maharashtra'],
                ['country',     'Country',      'text',   'India'],
                ['postal_code', 'Postal Code',  'text',   '400001'],
              ].map(([field, label, type, placeholder]) => (
                <div key={field} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" type={type} placeholder={placeholder}
                    value={form[field] ?? ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Client</label>
                <select className="form-select" value={form.client ?? ''} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}>
                  <option value="">No Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editSite ? 'Save Changes' : 'Add Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
