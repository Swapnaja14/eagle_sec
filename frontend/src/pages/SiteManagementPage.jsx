import React, { useState } from 'react';
import { mockClients, mockSites } from '../data/mockData';

const EXTENDED_SITES = [
  { id: 'site_1', name: 'Mumbai HQ', clientId: 'client_001', clientName: 'SecureGuard India', address: 'Nariman Point, Mumbai, MH 400021', guards: 248, status: 'active', lat: 18.9251, lng: 72.8249 },
  { id: 'site_2', name: 'Delhi Office', clientId: 'client_001', clientName: 'SecureGuard India', address: 'Connaught Place, New Delhi, DL 110001', guards: 185, status: 'active', lat: 28.6315, lng: 77.2167 },
  { id: 'site_3', name: 'Pune Campus', clientId: 'client_002', clientName: 'Sapphire Security', address: 'Hinjewadi IT Park, Pune, MH 411057', guards: 320, status: 'active', lat: 18.5913, lng: 73.7389 },
  { id: 'site_4', name: 'Bangalore Tech Park', clientId: 'client_003', clientName: 'RapidShield Corp', address: 'Electronic City Phase 1, Bengaluru, KA 560100', guards: 412, status: 'active', lat: 12.8390, lng: 77.6631 },
  { id: 'site_5', name: 'Hyderabad Zone', clientId: 'client_002', clientName: 'Sapphire Security', address: 'HITEC City, Hyderabad, TS 500081', guards: 276, status: 'inactive', lat: 17.4474, lng: 78.3762 },
  { id: 'site_6', name: 'Chennai Port', clientId: 'client_003', clientName: 'RapidShield Corp', address: 'Royapuram, Chennai, TN 600013', guards: 194, status: 'active', lat: 13.1096, lng: 80.2915 },
];

export default function SiteManagementPage() {
  const [sites, setSites] = useState(EXTENDED_SITES);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [newSite, setNewSite] = useState({ name: '', clientId: mockClients[0].id, address: '', guards: '' });

  const filtered = sites.filter(s => {
    if (clientFilter && s.clientId !== clientFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.address.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddSite = () => {
    if (!newSite.name || !newSite.address) return;
    const client = mockClients.find(c => c.id === newSite.clientId);
    setSites(prev => [...prev, {
      id: `site_new_${Date.now()}`,
      name: newSite.name, clientId: newSite.clientId, clientName: client?.name || '',
      address: newSite.address, guards: parseInt(newSite.guards) || 0,
      status: 'active', lat: 0, lng: 0,
    }]);
    setShowAddModal(false);
    setNewSite({ name: '', clientId: mockClients[0].id, address: '', guards: '' });
  };

  const totalGuards = sites.reduce((s, x) => s + x.guards, 0);

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Site Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage client deployment sites and guard allocation across locations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Site</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Sites', value: sites.length, color: 'var(--accent-blue)' },
          { label: 'Active Sites', value: sites.filter(s => s.status === 'active').length, color: 'var(--accent-green)' },
          { label: 'Total Guards', value: totalGuards.toLocaleString(), color: 'var(--accent-cyan)' },
          { label: 'Clients Served', value: new Set(sites.map(s => s.clientId)).size, color: 'var(--accent-purple)' },
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
            {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                <th>Guards</th>
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
                  <td style={{ color: 'var(--text-secondary)' }}>{site.clientName}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{site.address}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{site.guards.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${site.status === 'active' ? 'badge-active' : 'badge-archived'}`}>{site.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditSite(site)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" title="View Map">🗺️</button>
                      <button className="btn btn-ghost btn-sm" title="Deactivate" style={{ color: 'var(--accent-red)' }}>🚫</button>
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

      {/* Add Site Modal */}
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
                <input className="form-input" value={editSite ? editSite.name : newSite.name}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, name: e.target.value })) : setNewSite(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Mumbai South Hub" />
              </div>
              <div className="form-group">
                <label className="form-label">Client</label>
                <select className="form-select" value={editSite ? editSite.clientId : newSite.clientId}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, clientId: e.target.value })) : setNewSite(p => ({ ...p, clientId: e.target.value }))}>
                  {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea className="form-textarea" rows={2} style={{ width: '100%' }}
                  value={editSite ? editSite.address : newSite.address}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, address: e.target.value })) : setNewSite(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street, City, State, PIN" />
              </div>
              <div className="form-group">
                <label className="form-label">Guard Count</label>
                <input type="number" className="form-input"
                  value={editSite ? editSite.guards : newSite.guards}
                  onChange={e => editSite ? setEditSite(p => ({ ...p, guards: parseInt(e.target.value) || 0 })) : setNewSite(p => ({ ...p, guards: e.target.value }))}
                  placeholder="0" min={0} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => { setShowAddModal(false); setEditSite(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={editSite ? () => { setSites(prev => prev.map(s => s.id === editSite.id ? editSite : s)); setEditSite(null); } : handleAddSite}>
                {editSite ? 'Save Changes' : 'Add Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
