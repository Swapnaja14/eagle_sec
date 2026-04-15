import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_QUIZZES = [
  { id: 'q1', module: 'Access Control Procedures', questions: 10, timeLimit: 20, deadline: '2026-04-20', status: 'pending' },
  { id: 'q2', module: 'Customer Service Excellence', questions: 15, timeLimit: 20, deadline: '2026-04-25', status: 'pending' },
  { id: 'q3', module: 'Digital Security Awareness', questions: 10, timeLimit: 15, deadline: '2026-04-28', status: 'pending' },
];

const SAMPLE_QUESTIONS = [
  { id: 1, text: 'What is the primary purpose of an access control system?', options: ['To open doors remotely', 'To prevent unauthorized entry', 'To monitor CCTV footage', 'To record visitor logs'], correct: 1 },
  { id: 2, text: 'Which of the following is NOT a valid form of access credential?', options: ['Biometric scan', 'Key card/fob', 'PIN code', 'Job title'], correct: 3 },
  { id: 3, text: 'Security personnel must conduct perimeter checks every:', options: ['30 minutes', '1 hour', '2 hours', '4 hours'], correct: 2 },
  { id: 4, text: 'In case of a tailgating incident, the security guard should:', options: ['Ignore it if the person looks legitimate', 'Challenge the person and verify credentials', 'Call police immediately', 'File a report the next day'], correct: 1 },
  { id: 5, text: 'A visitor who loses their visitor pass should:', options: ['Be allowed to continue their visit', 'Be escorted out immediately', 'Report to reception for a replacement pass', 'Use a colleague\'s badge temporarily'], correct: 2 },
];

export default function TakeAssessmentPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('list'); // list | quiz | review | result
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleStart = (quiz) => {
    setSelectedQuiz(quiz);
    setAnswers({});
    setCurrentQ(0);
    setTimeLeft(quiz.timeLimit * 60);
    setPhase('quiz');
  };

  const handleSubmit = useCallback(() => {
    const correct = SAMPLE_QUESTIONS.filter((q, i) => answers[i] === q.correct).length;
    const score = Math.round((correct / SAMPLE_QUESTIONS.length) * 100);
    setPhase('result');
    setSubmitted({ correct, score, total: SAMPLE_QUESTIONS.length });
  }, [answers]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, handleSubmit]);

  const formatTime = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const progress = ((currentQ + 1) / SAMPLE_QUESTIONS.length) * 100;

  // ─── QUIZ LIST ───────────────────────────────────────────────────────────
  if (phase === 'list') {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Take Assessment</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 28px' }}>Complete your pending assessments before the deadline.</p>

        {AVAILABLE_QUIZZES.map(quiz => (
          <div key={quiz.id} className="card" style={{ padding: '24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>📝</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: 4 }}>{quiz.module}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <span>📋 {quiz.questions} questions</span>
                <span>⏱️ {quiz.timeLimit} minutes</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>🗓️ Due: {quiz.deadline}</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleStart(quiz)}>Start Now →</button>
          </div>
        ))}

        {AVAILABLE_QUIZZES.length === 0 && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: 'var(--text-primary)' }}>All caught up!</h3>
            <p style={{ color: 'var(--text-muted)' }}>No pending assessments at the moment.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── QUIZ INTERFACE ──────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = SAMPLE_QUESTIONS[currentQ];
    const isAnswered = answers[currentQ] !== undefined;
    const isLast = currentQ === SAMPLE_QUESTIONS.length - 1;

    return (
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedQuiz?.module}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Question {currentQ + 1} of {SAMPLE_QUESTIONS.length}</div>
          </div>
          <div style={{
            fontWeight: 900, fontSize: '1.5rem',
            color: timeLeft <= 60 ? 'var(--accent-red)' : timeLeft <= 300 ? 'var(--accent-yellow)' : 'var(--accent-green)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-blue)', borderRadius: 999, transition: 'width 0.3s ease' }} />
        </div>

        {/* Question */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>Q{currentQ + 1}</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 24px' }}>{q.text}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const selected = answers[currentQ] === i;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: selected ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                    border: `2px solid ${selected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s', color: selected ? 'var(--accent-blue)' : 'var(--text-primary)',
                    fontWeight: selected ? 700 : 400,
                  }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: selected ? 'var(--accent-blue)' : 'var(--bg-tertiary)', color: selected ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.15s' }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>← Previous</button>
          <div style={{ display: 'flex', gap: 6 }}>
            {SAMPLE_QUESTIONS.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${answers[i] !== undefined ? 'var(--accent-blue)' : 'var(--border-color)'}`, background: currentQ === i ? 'var(--accent-blue)' : answers[i] !== undefined ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)', color: currentQ === i ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                {i + 1}
              </button>
            ))}
          </div>
          {isLast ? (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!isAnswered}>Submit Quiz ✓</button>
          ) : (
            <button className="btn btn-primary" disabled={!isAnswered} onClick={() => setCurrentQ(c => c + 1)}>Next →</button>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT ──────────────────────────────────────────────────────────────
  if (phase === 'result' && submitted) {
    const passed = submitted.score >= 70;
    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{passed ? '🎉' : '😔'}</div>
        <h2 style={{ color: passed ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: 8 }}>
          {passed ? 'Well Done! You Passed!' : 'Keep Trying — You Can Do It!'}
        </h2>
        <div className="card" style={{ padding: '28px', marginBottom: 24, display: 'inline-block', minWidth: 280 }}>
          <div style={{ fontSize: '4rem', fontWeight: 900, color: passed ? 'var(--accent-green)' : 'var(--accent-red)', lineHeight: 1 }}>{submitted.score}%</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{submitted.correct} / {submitted.total} correct</div>
          <div style={{ marginTop: 12 }}>
            <span className={`badge ${passed ? 'badge-active' : 'badge-retired'}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
              {passed ? '✓ PASSED' : '✗ FAILED'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!passed && <button className="btn btn-primary" onClick={() => handleStart(selectedQuiz)}>Retry Assessment</button>}
          {passed && <button className="btn btn-primary" onClick={() => navigate('/trainee/certificates')}>Download Certificate 🎓</button>}
          <button className="btn btn-secondary" onClick={() => setPhase('list')}>Back to Assessments</button>
        </div>
      </div>
    );
  }

  return null;
}
