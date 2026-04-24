import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionsAPI, sitesAPI, clientsAPI, employeesAPI, trainingTopicsAPI } from '../services/api';
import './SessionSchedulerPage.css';

const PLATFORMS = [
  { id: 'zoom', label: 'Zoom', icon: '🔵' },
  { id: 'teams', label: 'Teams', icon: '🟣' },
  { id: 'meet', label: 'Google Meet', icon: '🟢' },
];

const TECH_TRAINING_TOPICS = [
  'Cybersecurity Fundamentals',
  'Network Security & Firewalls',
  'Cloud Security Best Practices',
  'AWS Security Essentials',
  'Azure Security & Identity',
  'Google Cloud Security',
  'SIEM & Security Monitoring',
  'SOC Operations Basics',
  'Incident Response & Forensics',
  'Threat Hunting Techniques',
  'Vulnerability Management',
  'Penetration Testing Basics',
  'Application Security (OWASP Top 10)',
  'API Security',
  'Secure Coding in Python',
  'DevSecOps Pipeline Security',
  'Container Security (Docker/Kubernetes)',
  'Linux Hardening',
  'Identity & Access Management (IAM)',
  'Zero Trust Security Model',
  'Data Privacy & Protection',
  'Endpoint Detection & Response',
  'Email & Phishing Defense',
  'Business Continuity & Disaster Recovery',
];

const MOCK_EMPLOYEES = [
  { id: 'EMP-10001', name: 'Ramesh Verma' },
  { id: 'EMP-10002', name: 'Anita Singh' },
  { id: 'EMP-10003', name: 'Suresh Patil' },
  { id: 'EMP-10004', name: 'Kavya Nair' },
  { id: 'EMP-10005', name: 'Deepak Rao' },
  { id: 'EMP-10006', name: 'Meera Joshi' },
  { id: 'EMP-10007', name: 'Arjun Kumar' },
];

export default function SessionSchedulerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isVirtual = location.pathname.includes('virtual');
  const [activeTab, setActiveTab] = useState(isVirtual ? 'virtual' : 'classroom');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [sites, setSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [trainingTopics, setTrainingTopics] = useState([]);
  const [pageError, setPageError] = useState(null);

  const [classroomForm, setClassroomForm] = useState({
    topic: '',
    trainerId: '',
    clientId: '',
    siteId: '',
    date: '',
    startTime: '',
    durationMinutes: 120,
    maxParticipants: 30,
    venue: '',
    notes: '',
    participants: [],
  });

  const [virtualForm, setVirtualForm] = useState({
    topic: '',
    trainerId: '',
    platform: 'zoom',
    meetingLink: '',
    date: '',
    startTime: '',
    durationMinutes: 90,
    maxParticipants: 50,
    notes: '',
    participants: [],
    sendCalendarInvite: true,
  });

  const [participantSearch, setParticipantSearch] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [topicOptions, setTopicOptions] = useState([]);

  // Update topic options when training topics are loaded
  useEffect(() => {
    if (trainingTopics.length > 0) {
      setTopicOptions(trainingTopics);
    }
  }, [trainingTopics]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [trainersRes, sitesRes, clientsRes, employeesRes, topicsRes] = await Promise.all([
          sessionsAPI.trainers(),
          sitesAPI.list(),
          clientsAPI.list(),
          employeesAPI.list(),
          trainingTopicsAPI.list(),
        ]);

        setTrainers(trainersRes.data || []);
        setSites(sitesRes.data || []);
        setClients(clientsRes.data || []);
        setEmployees(employeesRes.data || []);
        setTrainingTopics(topicsRes.data || []);

        // Set default client if available
        if (clientsRes.data && clientsRes.data.length > 0) {
          setClassroomForm(prev => ({ ...prev, clientId: clientsRes.data[0].id }));
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setPageError('Failed to load session data. Please refresh the page.');
        // Set empty arrays on error
        setTrainers([]);
        setSites([]);
        setClients([]);
        setEmployees([]);
        setTrainingTopics([]);
      }
    };
    fetchData();
  }, []);

  const form = activeTab === 'classroom' ? classroomForm : virtualForm;
  const setForm = activeTab === 'classroom' ? setClassroomForm : setVirtualForm;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const filteredEmployees = employees.filter(emp => {
    // Defensive checks to prevent crash on malformed data
    const name = emp?.name || '';
    const empId = emp?.employee_id || emp?.id || '';
    const searchLower = (participantSearch || '').toLowerCase();
    return (
      (name.toLowerCase().includes(searchLower) ||
        empId.toLowerCase().includes(searchLower)) &&
      !form.participants.find(p => p.id === emp.id)
    );
  });

  const addParticipant = (emp) => {
    setForm(prev => ({ ...prev, participants: [...prev.participants, emp] }));
  };

  const removeParticipant = (id) => {
    setForm(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== id) }));
  };

  const handleAddCustomTopic = () => {
    const topic = customTopic.trim();
    if (!topic) return;
    const exists = topicOptions.some(t => t.toLowerCase() === topic.toLowerCase());
    if (!exists) {
      setTopicOptions(prev => [...prev, topic]);
    }
    setForm(prev => ({ ...prev, topic }));
    setCustomTopic('');
    if (errors.topic) setErrors(prev => ({ ...prev, topic: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.topic) e.topic = 'Topic is required';
    if (!form.trainerId) e.trainerId = 'Trainer is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (activeTab === 'classroom' && !form.venue) e.venue = 'Venue is required';
    if (activeTab === 'virtual' && !form.meetingLink) e.meetingLink = 'Meeting link is required';
    return e;
  };

  const buildPayload = (targetStatus = 'scheduled') => {
    const dateTime = new Date(`${form.date}T${form.startTime}:00`);
    return {
      topic: form.topic,
      session_type: activeTab,
      trainer: form.trainerId ? Number(form.trainerId) : null,
      date_time: dateTime.toISOString(),
      duration_minutes: Number(form.durationMinutes || 60),
      attendee_count: form.participants.length,
      max_participants: Number(form.maxParticipants || 30),
      status: targetStatus,
      site: activeTab === 'classroom'
        ? (sites.find(s => s.id === form.siteId)?.name || '')
        : 'Online',
      venue: activeTab === 'classroom' ? form.venue : '',
      platform: activeTab === 'virtual' ? form.platform : '',
      meeting_link: activeTab === 'virtual' ? form.meetingLink : '',
      notes: form.notes || '',
    };
  };

  const createSession = async (targetStatus = 'scheduled') => {
    setSaving(true);
    setSubmitError('');
    try {
      await sessionsAPI.create(buildPayload(targetStatus));
      setSubmitted(true);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to schedule session.';
      setSubmitError(typeof detail === 'string' ? detail : 'Failed to schedule session.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    await createSession('scheduled');
  };

  const filteredSites = Array.isArray(sites) ? sites.filter(s => s?.client === form.clientId) : [];

  // Show error state if data fetch failed
  if (pageError) {
    return (
      <div className="scheduler-page" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ color: 'var(--accent-red)', marginBottom: 16, fontSize: '1.1rem' }}>{pageError}</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="scheduler-page">
      <div className="page-header">
        <h1 className="page-title">Schedule Training Session</h1>
        <p className="page-subtitle">Create and configure a new training session for your workforce.</p>
      </div>

      {/* Tabs */}
      <div className="scheduler-tabs">
        <button
          className={`scheduler-tab ${activeTab === 'classroom' ? 'active' : ''}`}
          onClick={() => { setActiveTab('classroom'); setSubmitted(false); }}
        >
          🏫 Classroom Session
        </button>
        <button
          className={`scheduler-tab ${activeTab === 'virtual' ? 'active' : ''}`}
          onClick={() => { setActiveTab('virtual'); setSubmitted(false); }}
        >
          💻 Virtual Session
        </button>
      </div>

      {submitted ? (
        <div className="success-banner">
          <h3>✅ Session Scheduled Successfully!</h3>
          <p style={{ marginBottom: 16 }}>
            "{form.topic}" has been scheduled for {form.date} at {form.startTime}.
            {form.participants.length > 0 && ` ${form.participants.length} participants have been notified.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Schedule Another</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/calendar')}>View Calendar</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div className="card" style={{ marginBottom: 12, padding: '10px 14px', color: 'var(--accent-red)' }}>
              {submitError}
            </div>
          )}
          <div className="card scheduler-card">

            {/* === SECTION: Basic Info === */}
            <div className="scheduler-section">
              <div className="scheduler-section-title">📋 Session Details</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Training Topic *</label>
                  <select className="form-select" name="topic" value={form.topic} onChange={handleChange}>
                    <option value="">Select Topic...</option>
                    {Array.isArray(topicOptions) ? topicOptions.map(m => <option key={m} value={m}>{m}</option>) : null}
                  </select>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      className="form-input"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Add custom training topic"
                    />
                    <button type="button" className="btn btn-secondary" onClick={handleAddCustomTopic}>
                      Add
                    </button>
                  </div>
                  {errors.topic && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.topic}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Trainer *</label>
                  <select className="form-select" name="trainerId" value={form.trainerId} onChange={handleChange}>
                    <option value="">Select Trainer...</option>
                    {Array.isArray(trainers) ? trainers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.username})</option>) : null}
                  </select>
                  {errors.trainerId && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.trainerId}</span>}
                </div>
              </div>
            </div>

            {/* === SECTION: Date & Time === */}
            <div className="scheduler-section">
              <div className="scheduler-section-title">📅 Date & Time</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date" className="form-input"
                    name="date" value={form.date} onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.date && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="time" className="form-input" name="startTime" value={form.startTime} onChange={handleChange} />
                  {errors.startTime && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.startTime}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <select className="form-select" name="durationMinutes" value={form.durationMinutes} onChange={handleChange}>
                    <option value={60}>60 mins (1 hr)</option>
                    <option value={90}>90 mins (1.5 hr)</option>
                    <option value={120}>120 mins (2 hr)</option>
                    <option value={180}>180 mins (3 hr)</option>
                    <option value={240}>240 mins (4 hr)</option>
                    <option value={480}>Full Day (8 hr)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* === SECTION: Location (Classroom only) === */}
            {activeTab === 'classroom' && (
              <div className="scheduler-section">
                <div className="scheduler-section-title">📍 Location</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select className="form-select" name="clientId" value={form.clientId} onChange={handleChange}>
                      <option value="">Select Client...</option>
                      {Array.isArray(clients) ? clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : null}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Site</label>
                    <select className="form-select" name="siteId" value={form.siteId} onChange={handleChange}>
                      <option value="">Select Site...</option>
                      {Array.isArray(filteredSites) ? filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : null}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Venue / Room *</label>
                    <input
                      className="form-input"
                      name="venue" value={form.venue} onChange={handleChange}
                      placeholder="e.g. Conference Room A, Training Hall 2..."
                    />
                    {errors.venue && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.venue}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* === SECTION: Platform (Virtual only) === */}
            {activeTab === 'virtual' && (
              <div className="scheduler-section">
                <div className="scheduler-section-title">🌐 Platform & Link</div>
                <div className="platform-grid">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id} type="button"
                      className={`platform-btn ${form.platform === p.id ? 'active' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, platform: p.id }))}
                    >
                      <span className="platform-icon">{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Meeting Link *</label>
                  <input
                    className="form-input"
                    name="meetingLink" value={form.meetingLink} onChange={handleChange}
                    placeholder="https://zoom.us/j/123456..."
                  />
                  {errors.meetingLink && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>{errors.meetingLink}</span>}
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <label className="toggle" style={{ flexShrink: 0 }}>
                      <input type="checkbox" name="sendCalendarInvite" checked={form.sendCalendarInvite} onChange={handleChange} />
                      <span className="toggle-slider" />
                    </label>
                    Send calendar invite to all participants
                  </label>
                </div>
              </div>
            )}

            {/* === SECTION: Capacity === */}
            <div className="scheduler-section">
              <div className="scheduler-section-title">👥 Capacity</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input type="number" className="form-input" name="maxParticipants" value={form.maxParticipants} onChange={handleChange} min={1} max={500} />
                </div>
                <div className="form-group">
                  <label className="form-label">Currently Selected</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: 42, fontSize: '1.1rem', fontWeight: 700, color: form.participants.length >= form.maxParticipants ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                    {form.participants.length} / {form.maxParticipants}
                  </div>
                </div>
              </div>
            </div>

            {/* === SECTION: Participants === */}
            <div className="scheduler-section">
              <div className="scheduler-section-title">🧑‍🤝‍🧑 Add Participants</div>
              <div className="participant-search-row">
                <input
                  className="form-input"
                  placeholder="Search by name or Employee ID..."
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              {participantSearch && filteredEmployees.length > 0 && (
                <div className="card" style={{ padding: '8px', marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                  {filteredEmployees.slice(0, 5).map(emp => (
                    <div
                      key={emp.id}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { addParticipant(emp); setParticipantSearch(''); }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.employee_id}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="participant-chips">
                {form.participants.length === 0
                  ? <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No participants added yet...</span>
                  : form.participants.map(p => (
                    <div key={p.id} className="participant-chip">
                      {p.name} <button type="button" onClick={() => removeParticipant(p.id)}>×</button>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* === SECTION: Notes === */}
            <div className="scheduler-section">
              <div className="scheduler-section-title">📝 Notes & Instructions</div>
              <textarea
                className="form-textarea"
                name="notes" value={form.notes} onChange={handleChange}
                placeholder="Additional instructions for participants..."
                rows={3}
                style={{ width: '100%' }}
              />
            </div>

          </div>

          <div className="scheduler-footer">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="button" className="btn btn-secondary" onClick={() => createSession('draft')} disabled={saving}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Scheduling...' : (activeTab === 'classroom' ? '🏫 Schedule Classroom Session' : '💻 Schedule Virtual Session')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
