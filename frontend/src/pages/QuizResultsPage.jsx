import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './QuizResultsPage.css';

const QuizResultsPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!result && submissionId) {
      fetchResult();
    }
  }, [submissionId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`http://localhost:8000/api/assessments/submissions/${submissionId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fetching result:', error);
      setError(error.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quiz-results-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-results-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error Loading Results</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/assessments')}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="quiz-results-page">
        <div className="error-container">
          <div className="error-icon">🔍</div>
          <h2>Results Not Found</h2>
          <p>The submission you're looking for doesn't exist or you don't have permission to view it.</p>
          <button className="btn-primary" onClick={() => navigate('/assessments')}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const passed = result.passed;
  const percentage = result.percentage;
  const timeMinutes = Math.floor(result.time_taken_seconds / 60);
  const timeSeconds = result.time_taken_seconds % 60;

  return (
    <div className="quiz-results-page">
      <div className="results-container">
        <div className={`results-header ${passed ? 'passed' : 'failed'}`}>
          <div className="result-icon">
            {passed ? '🎉' : '📚'}
          </div>
          <h1>{passed ? 'Congratulations!' : 'Keep Learning!'}</h1>
          <p className="result-message">
            {passed 
              ? 'You have successfully passed the assessment!' 
              : 'You did not pass this time, but you can try again.'}
          </p>
        </div>

        <div className="score-card">
          <div className="score-circle">
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={passed ? '#10b981' : '#ef4444'}
                strokeWidth="20"
                strokeDasharray={`${percentage * 5.65} 565`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{percentage.toFixed(1)}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>
        </div>

        <div className="results-details">
          <div className="detail-card">
            <div className="detail-icon">📊</div>
            <div className="detail-content">
              <span className="detail-label">Points Earned</span>
              <span className="detail-value">{result.score} / {result.total_points}</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-icon">⏱️</div>
            <div className="detail-content">
              <span className="detail-label">Time Taken</span>
              <span className="detail-value">{timeMinutes}m {timeSeconds}s</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-icon">🎯</div>
            <div className="detail-content">
              <span className="detail-label">Attempt</span>
              <span className="detail-value">#{result.attempt_number}</span>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-icon">{passed ? '✅' : '❌'}</div>
            <div className="detail-content">
              <span className="detail-label">Status</span>
              <span className={`detail-value ${passed ? 'passed' : 'failed'}`}>
                {passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>

        {result.answers && result.answers.length > 0 && (
          <div className="answers-section">
            <h2>Your Answers</h2>
            <div className="answers-list">
              {result.answers.map((answer, index) => (
                <div key={answer.id} className={`answer-item ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                  <div className="answer-header">
                    <span className="answer-number">Question {index + 1}</span>
                    <span className={`answer-badge ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                      {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <p className="answer-question">{answer.question_text}</p>
                  <div className="answer-points">
                    Points: {answer.points_earned} / {answer.quiz_question?.points || 10}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="results-actions">
          <button className="btn-secondary" onClick={() => navigate('/assessments')}>
            Back to Assessments
          </button>
          {!passed && (
            <button className="btn-primary" onClick={() => navigate(`/quiz/${result.quiz}/take`)}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;
