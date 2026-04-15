import React, { useState } from 'react';
import { mockTrainers, mockTrainingModules } from '../data/mockData';

const CRITERIA = [
  { id: 'content', label: 'Content Quality', desc: 'Was the training material relevant and well-prepared?' },
  { id: 'trainer', label: 'Trainer Effectiveness', desc: 'Was the trainer engaging and knowledgeable?' },
  { id: 'pacing', label: 'Session Pacing', desc: 'Was the timing and flow of the session appropriate?' },
  { id: 'practical', label: 'Practical Relevance', desc: 'Could you apply what was taught to your daily work?' },
  { id: 'facilities', label: 'Facilities & Setup', desc: 'Was the venue/virtual setup comfortable and functional?' },
];

function StarRating({ value, onChange, id }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star} type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.8rem', padding: 2, lineHeight: 1,
            color: star <= (hover || value) ? '#f59e0b' : 'var(--bg-tertiary)',
            transition: 'color 0.15s',
          }}
        >★</button>
      ))}
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center', marginLeft: 4 }}>
        {(hover || value) > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hover || value] : ''}
      </span>
    </div>
  );
}

export default function SessionEvaluationPage() {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState('');
  const [recommend, setRecommend] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectedSession, setSelectedSession] = useState({ module: mockTrainingModules[0], trainer: mockTrainers[0].name });
  const [errors, setErrors] = useState({});

  const setRating = (id, val) => setRatings(prev => ({ ...prev, [id]: val }));

  const overallRating = Object.keys(ratings).length > 0
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / CRITERIA.length).toFixed(1)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    CRITERIA.forEach(c => { if (!ratings[c.id]) errs[c.id] = true; });
    if (recommend === null) errs.recommend = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Thank You for Your Feedback!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Your evaluation for "{selectedSession.module}" has been recorded. Your feedback helps us improve training quality.
        </p>
        <div className="card" style={{ padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-yellow)', marginBottom: 4 }}>
            {overallRating} ★
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your Overall Rating</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSubmitted(false); setRatings({}); setComments(''); setRecommend(null); setErrors({}); }}>
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

      {/* Session Info Card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Training Module</label>
            <select className="form-select" value={selectedSession.module} onChange={e => setSelectedSession(p => ({ ...p, module: e.target.value }))}>
              {mockTrainingModules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Trainer</label>
            <select className="form-select" value={selectedSession.trainer} onChange={e => setSelectedSession(p => ({ ...p, trainer: e.target.value }))}>
              {mockTrainers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
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
                <StarRating value={ratings[criterion.id] || 0} onChange={v => { setRating(criterion.id, v); setErrors(p => ({ ...p, [criterion.id]: false })); }} id={criterion.id} />
              </div>
              {errors[criterion.id] && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '8px 0 0' }}>Please provide a rating</p>}
            </div>
          ))}
        </div>

        {/* Overall at-a-glance */}
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
                onClick={() => { setRecommend(opt.val); setErrors(p => ({ ...p, recommend: false })); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.recommend && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '8px 0 0' }}>Please select an option</p>}
        </div>

        {/* Comments */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 28 }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>Additional Comments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span></h4>
          <textarea
            className="form-textarea"
            rows={4}
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Share any suggestions, highlights, or areas for improvement..."
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-ghost">Clear Form</button>
          <button type="submit" className="btn btn-primary">⭐ Submit Evaluation</button>
        </div>
      </form>
    </div>
  );
}
