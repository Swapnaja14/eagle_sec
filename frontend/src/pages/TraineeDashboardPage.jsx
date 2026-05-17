import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

export default function TraineeDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardAPI.getTraineeOverview();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load trainee dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16, animation: 'spin 1s linear infinite' }}>⚙️</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading your dashboard…</p>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚠️</div>
        <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: 12 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard}>Retry</button>
      </div>
    );
  }

  const myTraining = data?.my_training || [];
  const upcomingSessions = data?.upcoming_sessions || [];
  const pendingAssessments = data?.pending_assessments || [];
  const serverUser = data?.user || {};

  const displayName = serverUser.first_name || user?.first_name || 'Trainee';
  const passed = myTraining.filter(t => t.status === 'passed').length;
  const total = myTraining.length;
  const scoredItems = myTraining.filter(t => t.score !== null && t.score !== undefined);
  const avgScore = scoredItems.length
    ? Math.round(scoredItems.reduce((s, t) => s + t.score, 0) / scoredItems.length)
    : 0;
  const certs = myTraining.filter(t => t.certificateReady).length;

  // PSARA expiry — user profile field or fallback 22 days mock
  const psaraExpiry = new Date(user?.psaraExpiry || Date.now() + 22 * 86400000);
  const daysLeft = Math.max(0, Math.ceil((psaraExpiry - Date.now()) / 86400000));
  const psaraUrgent = daysLeft <= 30;

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontSize: '4rem', marginBottom: 24 }}>📱</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
        Please Use the Mobile App
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 32 }}>
        As a trainee, your learning experience, training history, and assessments are optimized for the mobile application. Please download and login to the Eagle Sec mobile app to continue your training.
      </p>
      <button 
        className="btn btn-primary" 
        onClick={() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
