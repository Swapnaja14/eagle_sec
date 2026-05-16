import React, { useState, useEffect } from 'react';
import { sitesAPI, clientsAPI } from '../services/api';

export default function SiteManagementPage() {
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newSite, setNewSite] = useState({ name: '', client: '', address: '', guards: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sitesRes, clientsRes] = await Promise.all([
        sitesAPI.list(),
        clientsAPI.list(),
      ]);
      setSites(sitesRes.data);
      setClients(clientsRes.data);
      if (clientsRes.data.length > 0 && !newSite.client) {
        setNewSite(prev => ({ ...prev, client: clientsRes.data[0].id }));
      }
    } catch (err) {
      setError('Failed to load sites or clients.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = sites.filter(s => {
    if (clientFilter && String(s.client_id) !== String(clientFilter)) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.address?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddSite = async () => {
    if (!newSite.name || !newSite.address) return;
    setSaving(true);
    try {
      const res = await sitesAPI.create({
        name: newSite.name,
        address: newSite.address,
        client: newSite.client || null,
        is_active: true,
      });
      setSites(prev => [...prev, res.data]);
      setShowAddModal(false);
      setNewSite({ name: '', client: clients[0]?.id || '', address: '', guards: '' });
    } catch (err) {
      setError('Failed to create site.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const res = await sitesAPI.update(editSite.id, {
        name: editSite.name,
        address: editSite.address,
        client: editSite.client_id || null,
        is_active: editSite.is_active,
      });
      setSites(prev => prev.map(s => s.id === editSite.id ? { ...s, ...res.data } : s));
      setEditSite(null);
    } catch (err) {
      setError('Failed to update site.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (site) => {
    try {
      await sitesAPI.update(site.id, { is_active: !site.is_active });
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, is_active: !s.is_active } : s));
    } catch (err) {
      setError('Failed to update site status.');
    }
  };

  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = c.name; });

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading sites...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Site Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage client deployment sites and guard allocation across locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Site</button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 16, color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Sites', value: sites.length, color: 'var(--accent-blue)' },
          { label: 'Active Sites', value: sites.filter(s => s.is_active).length, color: 'var(--accent-green)' },
          { label: 'Inactive Sites', value: sites.filter(s => !s.is_active).length, color: 'var(--accent-red)' },
          { label: 'Clients Served', value: new Set(sites.map(s => s.client_id).filter(Boolean)).size, color: 'var(--accent-purple)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
          <label className="form-label">Search Site</label>
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Site name or address..." />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
          <label className="form-label">Client</label>
          <select className="form-select" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Sites Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Client</th>
                <th>Address</th>
                <th>City</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(site => (
                <tr key={site.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem' }}>📍</span> {site.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{clientMap[site.client_id] || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.address || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{site.city || '—'}</td>
                  <td>
                    <span className={`badge ${site.is_active ? 'badge-active' : 'badge-archived'}`}>{site.is_active ? 'active' : 'inactive'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditSite(site)}>✏️</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={site.is_active ? 'Deactivate' : 'Activate'}
                        style={{ color: site.is_active ? 'var(--accent-red)' : 'var(--accent-green)' }}
                        onClick={() => handleDeactivate(site)}
                      >
                        {site.is_active ? '🚫' : '✅'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No sites found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {filtered.length} sites shown
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editSite) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditSite(null); }}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{editSite ? `Edit: ${editSite.name}` : 'Add New Site'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddModal(false); setEditSite(null); }}>✕</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Site Name *</label>
                <input className="form-input"
                  value={editSite ? editSite.name : newSite.name}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, name: e.target.value })) : setNewSite(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Mumbai South Hub" />
              </div>
              <div className="form-group">
                <label className="form-label">Client</label>
                <select className="form-select"
                  value={editSite ? (editSite.client_id || '') : newSite.client}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, client_id: e.target.value })) : setNewSite(p => ({ ...p, client: e.target.value }))}>
                  <option value="">No Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea className="form-textarea" rows={2} style={{ width: '100%' }}
                  value={editSite ? editSite.address : newSite.address}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, address: e.target.value })) : setNewSite(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street, City, State, PIN" />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => { setShowAddModal(false); setEditSite(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={editSite ? handleEditSave : handleAddSite} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : (editSite ? 'Save Changes' : 'Add Site')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
