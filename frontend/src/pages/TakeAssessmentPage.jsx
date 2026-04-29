import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { dashboardAPI, assessmentsAPI } from '../services/api';

export default function TakeAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── State ───────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('list'); // list | quiz | result
  const [quizzes, setQuizzes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [resultData, setResultData] = useState(null);

  // ── Load pending quizzes on mount ───────────────────────────────────────
  useEffect(() => {
    if (phase === 'list') {
      loadPendingQuizzes();
    }
  }, [phase]);

  const loadPendingQuizzes = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const res = await dashboardAPI.getTraineeOverview();
      setQuizzes(res.data.pending_assessments || []);

      // If navigated with a specific quizId (from dashboard), auto-start
      const preselectedId = location.state?.quizId;
      if (preselectedId) {
        const target = (res.data.pending_assessments || []).find(q => q.id === preselectedId);
        if (target) handleStart(target);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setError('Unable to load assessments. Please try again.');
    } finally {
      setPageLoading(false);
    }
  };

  // ── Start a quiz ────────────────────────────────────────────────────────
  const handleStart = async (quiz) => {
    try {
      setActionLoading(true);
      setError(null);

      // Create a submission record in the backend
      const subRes = await assessmentsAPI.startQuiz(quiz.id);
      const sub = subRes.data;

      // Fetch the questions for this quiz
      const qRes = await assessmentsAPI.getQuestions(quiz.id);
      const qs = qRes.data;

      if (!qs || qs.length === 0) {
        setError('This assessment has no questions yet. Please contact your administrator.');
        return;
      }

      setSelectedQuiz(quiz);
      setSubmission(sub);
      setQuestions(qs);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft((quiz.timeLimit || 30) * 60);
      setPhase('quiz');
    } catch (err) {
      console.error('Failed to start quiz:', err);
      const msg = err.response?.data?.error || 'Could not start assessment. Please try again.';
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Submit the quiz ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!submission) return;
    try {
      setActionLoading(true);
      const res = await assessmentsAPI.completeSubmission(submission.id);
      setResultData(res.data);
      setPhase('result');
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Submission failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [submission]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, handleSubmit]);

  // ── Save answer per-question in real-time ─────────────────────────────
  const selectAnswer = async (qIndex, optionIndex, optionText) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    const questionWrapper = questions[qIndex];
    if (!questionWrapper || !submission) return;
    try {
      await assessmentsAPI.submitAnswer(submission.id, {
        question_id: questionWrapper.question.id,
        selected_answer: optionText,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const formatTime = (secs) =>
    `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  // ── LIST PHASE ───────────────────────────────────────────────────────────
  if (phase === 'list') {
    if (pageLoading) {
      return (
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚙️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading assessments…</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Take Assessment
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Complete your pending assessments before the deadline.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, color: 'var(--accent-red)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {actionLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔄</div>
            <p style={{ color: 'var(--text-secondary)' }}>Starting assessment…</p>
          </div>
        )}

        {!actionLoading && quizzes.length === 0 && !error && (
          <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>All caught up!</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No pending assessments at the moment.</p>
          </div>
        )}

        {!actionLoading && quizzes.map(quiz => (
          <div key={quiz.id} className="card" style={{ padding: '24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              📝
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: 4 }}>{quiz.module}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.84rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span>📋 {quiz.questions} questions</span>
                <span>⏱️ {quiz.timeLimit} minutes</span>
                {quiz.deadline && quiz.deadline !== 'N/A' && (
                  <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>🗓️ Due: {quiz.deadline}</span>
                )}
                {quiz.attempted && (
                  <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>⚠️ Previously attempted</span>
                )}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleStart(quiz)}>
              {quiz.attempted ? 'Retry Now →' : 'Start Now →'}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ── QUIZ PHASE ───────────────────────────────────────────────────────────
  if (phase === 'quiz' && questions.length > 0) {
    const qWrapper = questions[currentQ];
    const qDetails = qWrapper?.question || {};

    let options = [];
    if (qDetails.options) {
      options = typeof qDetails.options === 'string'
        ? JSON.parse(qDetails.options)
        : qDetails.options;
    }

    const progress = ((currentQ + 1) / questions.length) * 100;
    const isAnswered = answers[currentQ] !== undefined;
    const isLast = currentQ === questions.length - 1;

    return (
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, padding: '16px 20px',
          background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{selectedQuiz?.module}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Question {currentQ + 1} of {questions.length}
            </div>
          </div>
          <div style={{
            fontWeight: 900, fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums',
            color: timeLeft <= 60 ? 'var(--accent-red)' : timeLeft <= 300 ? 'var(--accent-yellow)' : 'var(--accent-green)',
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 999, marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-blue)', borderRadius: 999, transition: 'width 0.3s ease' }} />
        </div>

        {/* Question */}
        <div className="card" style={{ padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Q{currentQ + 1}
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 24px' }}>
            {qDetails.text}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => {
              const selected = answers[currentQ] === i;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentQ, i, opt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: selected ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                    border: `2px solid ${selected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                    color: selected ? 'var(--accent-blue)' : 'var(--text-primary)',
                    fontWeight: selected ? 700 : 400,
                  }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: selected ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                    color: selected ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Navigator + Prev/Next */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={currentQ === 0} onClick={() => setCurrentQ(c => c - 1)}>
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: `2px solid ${answers[i] !== undefined ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  background: currentQ === i ? 'var(--accent-blue)' : answers[i] !== undefined ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)',
                  color: currentQ === i ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {isLast ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!isAnswered || actionLoading}
            >
              {actionLoading ? 'Submitting…' : 'Submit Quiz ✓'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!isAnswered}
              onClick={() => setCurrentQ(c => c + 1)}
            >
              Next →
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: 'var(--accent-red)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  // ── RESULT PHASE ─────────────────────────────────────────────────────────
  if (phase === 'result' && resultData) {
    const passed = resultData.passed;
    const percentage = Math.round(resultData.percentage || 0);
    const score = resultData.score || 0;
    const totalPoints = resultData.total_points || 0;

    return (
      <div style={{ padding: '80px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{passed ? '🎉' : '😔'}</div>
        <h2 style={{ color: passed ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: 8 }}>
          {passed ? 'Well Done! You Passed!' : 'Keep Trying — You Can Do It!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          {selectedQuiz?.module}
        </p>

        <div className="card" style={{ padding: '36px', marginBottom: 24, display: 'inline-block', minWidth: 300 }}>
          <div style={{ fontSize: '4.5rem', fontWeight: 900, color: passed ? 'var(--accent-green)' : 'var(--accent-red)', lineHeight: 1, marginBottom: 8 }}>
            {percentage}%
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            {score} / {totalPoints} points
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{resultData.attempt_number || '—'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attempt</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {resultData.time_taken_seconds ? `${Math.round(resultData.time_taken_seconds / 60)}m` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time Taken</div>
            </div>
          </div>
          <span className={`badge ${passed ? 'badge-active' : 'badge-retired'}`} style={{ fontSize: '0.85rem', padding: '4px 16px' }}>
            {passed ? '✓ PASSED' : '✗ FAILED'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!passed && (
            <button className="btn btn-primary" onClick={() => handleStart(selectedQuiz)}>
              🔄 Retry Assessment
            </button>
          )}
          {passed && (
            <button className="btn btn-primary" onClick={() => navigate('/trainee/certificates')}>
              🎓 Download Certificate
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => { setPhase('list'); setResultData(null); }}>
            ← Back to Assessments
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/trainee/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
