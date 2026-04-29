import React, { useState, useEffect } from 'react';
import { feedbackAPI, sessionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CRITERIA = [
  { id: 'content',    label: 'Content Quality',       desc: 'Was the training material relevant and well-prepared?' },
  { id: 'trainer',    label: 'Trainer Effectiveness',  desc: 'Was the trainer engaging and knowledgeable?' },
  { id: 'pacing',     label: 'Session Pacing',         desc: 'Was the timing and flow of the session appropriate?' },
  { id: 'practical',  label: 'Practical Relevance',    desc: 'Could you apply what was taught to your daily work?' },
  { id: 'facilities', label: 'Facilities & Setup',     desc: 'Was the venue/virtual setup comfortable and functional?' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', padding: 2, lineHeight: 1,
            color: star <= (hover || value) ? '#f59e0b' : 'var(--bg-tertiary)', transition: 'color 0.15s' }}>
          ★
        </button>
      ))}
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center', marginLeft: 4 }}>
        {(hover || value) > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][hover || value] : ''}
      </span>
    </div>
  );
}

export default function SessionEvaluationPage() {
  const { user } = useAuth();
  const [sessions,         setSessions]         = useState([]);
  const [selectedSession,  setSelectedSession]  = useState('');
  const [ratings,          setRatings]          = useState({});
  const [comments,         setComments]         = useState('');
  const [recommend,        setRecommend]        = useState(null);
  const [submitted,        setSubmitted]        = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [errors,           setErrors]           = useState({});
  const [submitError,      setSubmitError]      = useState('');

  useEffect(() => {
    sessionsAPI.list({ status: 'completed' })
      .then(r => setSessions(r.data?.results ?? r.data ?? []))
      .catch(() => setSessions([]));
  }, []);

  const setRating = (id, val) => setRatings(p => ({ ...p, [id]: val }));

  const overallRating = Object.keys(ratings).length > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIA.length).toFixed(1)
    : null;

  const handleClear = () => {
    setRatings({}); setComments(''); setRecommend(null); setErrors({}); setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selectedSession) errs.session = true;
    CRITERIA.forEach(c => { if (!ratings[c.id]) errs[c.id] = true; });
    if (recommend === null) errs.recommend = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const session = sessions.find(s => String(s.id) === String(selectedSession));
      // Average all criteria ratings as the single rating value
      const avgRating = Math.round(
        Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIA.length
      );
      const commentParts = [
        comments,
        `Recommend: ${recommend ? 'Yes' : 'No'}`,
        ...CRITERIA.map(c => `${c.label}: ${ratings[c.id]}/5`),
      ].filter(Boolean).join(' | ');

      await feedbackAPI.create({
        session: selectedSession,
        trainer: session?.trainer ?? session?.trainer_id,
        rating: avgRating,
        comments: commentParts,
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.response?.data?.detail ?? JSON.stringify(e.response?.data) ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Thank You for Your Feedback!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Your evaluation has been recorded. Your feedback helps us improve training quality.
        </p>
        <div className="card" style={{ padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-yellow)', marginBottom: 4 }}>{overallRating} ★</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your Overall Rating</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSubmitted(false); handleClear(); setSelectedSession(''); }}>
          Submit Another Evaluation
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Session Evaluation Form</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Share your feedback to help improve training quality.</p>
      </div>

      {/* Session selector */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Select Training Session *</label>
          <select className="form-select" value={selectedSession}
            onChange={e => { setSelectedSession(e.target.value); setErrors(p => ({ ...p, session: false })); }}
            style={{ borderColor: errors.session ? 'var(--accent-red)' : undefined }}>
            <option value="">— Choose a completed session —</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.topic} — {s.date_time ? new Date(s.date_time).toLocaleDateString() : ''}
              </option>
            ))}
          </select>
          {errors.session && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '4px 0 0' }}>Please select a session</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rating Criteria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {CRITERIA.map(criterion => (
            <div key={criterion.id} className="card" style={{ padding: '20px 24px', borderColor: errors[criterion.id] ? 'rgba(239,68,68,0.4)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '1rem' }}>{criterion.label}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{criterion.desc}</p>
                </div>
                <StarRating value={ratings[criterion.id] || 0}
                  onChange={v => { setRating(criterion.id, v); setErrors(p => ({ ...p, [criterion.id]: false })); }} />
              </div>
              {errors[criterion.id] && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '8px 0 0' }}>Please provide a rating</p>}
            </div>
          ))}
        </div>

        {overallRating && (
          <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{overallRating} ★</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Overall Session Rating</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on {Object.keys(ratings).length} of {CRITERIA.length} criteria</div>
            </div>
          </div>
        )}

        {/* Recommend */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Would you recommend this training to a colleague?</h4>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ val: true, label: '👍 Yes, Definitely' }, { val: false, label: '👎 Not Really' }].map(opt => (
              <button key={String(opt.val)} type="button"
                className={`btn btn-sm ${recommend === opt.val ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setRecommend(opt.val); setErrors(p => ({ ...p, recommend: false })); }}>
                {opt.label}
              </button>
            ))}
          </div>
          {errors.recommend && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '8px 0 0' }}>Please select an option</p>}
        </div>

        {/* Comments */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 28 }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Additional Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></h4>
          <textarea className="form-textarea" rows={4} value={comments} onChange={e => setComments(e.target.value)}
            placeholder="Share any suggestions, highlights, or areas for improvement..." style={{ width: '100%' }} />
        </div>

        {submitError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: 'var(--accent-red)' }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={handleClear}>Clear Form</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : '⭐ Submit Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
