import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TrainerProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    department: user?.department || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateUser(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'trainer': 'Trainer',
      'trainee': 'Trainee'
    };
    return roleMap[role] || role;
  };

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return user.avatar.startsWith('http') ? user.avatar : `/api${user.avatar}`;
    }
    return null;
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 16,
        padding: '28px 32px',
        marginBottom: 28,
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
            My Profile
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {user?.first_name} {user?.last_name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {getRoleDisplay(user?.role)} • {user?.tenant?.name || 'No Organization'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/trainer/dashboard')}
          >
            Back to Dashboard
          </button>
          {!isEditing && (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {
        message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: message.type === 'success' ? '#22c55e' : '#ef4444'
          }}>
            {message.text}
          </div>
        )
      }

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column - Avatar Card */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: getAvatarUrl() ? 'transparent' : 'var(--accent-blue)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: 'white',
              overflow: 'hidden',
              border: '3px solid var(--border-color)'
            }}>
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()
              )}
            </div>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>
              {user?.first_name} {user?.last_name}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              @{user?.username}
            </p>
            <div style={{
              marginTop: 12,
              padding: '4px 12px',
              background: 'rgba(59,130,246,0.15)',
              borderRadius: 20,
              display: 'inline-block',
              color: 'var(--accent-blue)',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {getRoleDisplay(user?.role)}
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Member Since</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Organization</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {user?.tenant?.name || 'Not assigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            Profile Information
          </h3>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem'
                  }}
                  placeholder="e.g., Security Training"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      first_name: user?.first_name || '',
                      last_name: user?.last_name || '',
                      email: user?.email || '',
                      department: user?.department || '',
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>First Name</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                    {user?.first_name || 'Not set'}
                  </div>
                </div>
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Last Name</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                    {user?.last_name || 'Not set'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Email Address</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                  {user?.email || 'Not set'}
                </div>
              </div>

              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Username</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                  {user?.username}
                </div>
              </div>

              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Department</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                  {user?.department || 'Not assigned'}
                </div>
              </div>

              <div style={{ padding: '16px 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Role</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                  {getRoleDisplay(user?.role)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
