import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { mockGuards } from '../data/mockData';
import './PSARADashboardPage.css';

export default function PSARADashboardPage() {
  const [search, setSearch] = useState('');

  const filteredGuards = mockGuards.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const totalGuards = mockGuards.length;
  const compliantCount = mockGuards.filter(g => g.psaraStatus === 'compliant').length;
  const expiringCount = mockGuards.filter(g => g.psaraStatus === 'expiring').length;
  const expiredCount = mockGuards.filter(g => g.psaraStatus === 'expired').length;

  const data = [
    { name: 'Compliant', value: compliantCount, color: '#22c55e' }, // emerald
    { name: 'Expiring (7-30 days)', value: expiringCount, color: '#f59e0b' }, // amber
    { name: 'Expired/Critical', value: expiredCount, color: '#ef4444' } // red
  ];

  const criticalGuards = expiringCount + expiredCount;

  return (
    <div className="psara-dashboard">
      <div className="page-header">
        <h1 className="page-title">PSARA Compliance Dashboard</h1>
        <p className="page-subtitle">Track regulatory compliance and certification expiries for all deployed guards.</p>
      </div>

      {criticalGuards > 0 && (
        <div className="psara-alert-banner">
          <div className="psara-alert-text">
            <span>⚠️</span>
            {criticalGuards} guards have PSARA certification expiring soon or already expired.
          </div>
          <button className="btn btn-danger">Send Bulk Alert</button>
        </div>
      )}

      <div className="psara-stats">
        <div className="card stat-card">
          <p className="stat-label">Total Guards</p>
          <h2 className="stat-value">{totalGuards.toLocaleString()}</h2>
        </div>
        <div className="card stat-card">
          <p className="stat-label">PSARA Compliant</p>
          <h2 className="stat-value" style={{ color: 'var(--accent-green)' }}>
            {compliantCount.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>({((compliantCount/totalGuards)*100).toFixed(1)}%)</span>
          </h2>
        </div>
        <div className="card stat-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p className="stat-label">Expiring / Expired</p>
          <h2 className="stat-value" style={{ color: 'var(--accent-red)' }}>
            {criticalGuards.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>({((criticalGuards/totalGuards)*100).toFixed(1)}%)</span>
          </h2>
        </div>
      </div>

      <div className="psara-chart-container">
        <div className="card psara-chart-card">
          <h3 style={{ alignSelf: 'flex-start', margin: '0 0 20px', color: 'var(--text-primary)' }}>Compliance Distribution</h3>
          <div style={{ width: '100%', height: 350, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#f0f6fc', borderRadius: 8 }}
                  itemStyle={{ color: '#f0f6fc', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="psara-chart-center">
              <div className="psara-chart-center-value">{((compliantCount/totalGuards)*100).toFixed(0)}%</div>
              <div className="psara-chart-center-label">Compliant</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
            {data.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: d.color }}></span>
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="psara-table-wrapper">
        <div className="psara-table-toolbar">
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Guard Compliance Roster</h3>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Check Individual Guard Compliance (Name or ID)..." 
            style={{ width: '350px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Guard ID</th>
                <th>Guard Name</th>
                <th>Site</th>
                <th>PSARA Status</th>
                <th>Last Training</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuards.map((guard) => (
                <tr key={guard.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{guard.employeeId}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{guard.name}</td>
                  <td>{guard.siteName}</td>
                  <td>
                    <span className={`badge badge-${guard.psaraStatus === 'compliant' ? 'active' : guard.psaraStatus === 'expiring' ? 'draft' : 'retired'}`}>
                      {guard.psaraStatus}
                    </span>
                  </td>
                  <td>{new Date(guard.lastTrainingDate).toLocaleDateString()}</td>
                  <td>{new Date(guard.psaraExpiryDate).toLocaleDateString()}</td>
                  <td style={{ 
                    color: guard.daysUntilExpiry > 30 ? 'var(--accent-green)' : guard.daysUntilExpiry > 0 ? 'var(--accent-yellow)' : 'var(--accent-red)',
                    fontWeight: 600
                  }}>
                    {guard.daysUntilExpiry > 0 ? `${guard.daysUntilExpiry} days` : 'Expired'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm">{guard.daysUntilExpiry > 0 ? 'Send Reminder' : 'Re-enroll'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGuards.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No guards found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
