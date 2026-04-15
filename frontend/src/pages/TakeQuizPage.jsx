import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TakeQuizPage.css';

const TakeQuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizAndStart();
  }, [quizId]);

  useEffect(() => {
    if (timeRemaining > 0 && submission?.status === 'in_progress') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, submission]);

  const fetchQuizAndStart = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch quiz details
      const quizResponse = await fetch(`http://localhost:8000/api/assessments/quizzes/${quizId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const quizData = await quizResponse.json();
      setQuiz(quizData);

      // Fetch questions
      const questionsResponse = await fetch(`http://localhost:8000/api/assessments/quizzes/${quizId}/questions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);

      // Start quiz
      const startResponse = await fetch(`http://localhost:8000/api/assessments/quizzes/${quizId}/start_quiz/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const submissionData = await startResponse.json();
      setSubmission(submissionData);
      setTimeRemaining(quizData.time_limit_minutes * 60);

    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionId, selectedAnswer) => {
    setAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }));

    // Submit answer to backend
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/assessments/submissions/${submission.id}/submit_answer/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          selected_answer: selectedAnswer
        })
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/assessments/submissions/${submission.id}/complete_submission/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      navigate(`/quiz-results/${submission.id}`, { state: { result } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (!quiz || questions.length === 0) {
    return <div className="error">Quiz not found or has no questions</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="take-quiz-page">
      <div className="quiz-header">
        <div className="quiz-info">
          <h1>{quiz.title}</h1>
          <p>{quiz.description}</p>
        </div>
        <div className="quiz-timer">
          <span className="timer-label">Time Remaining</span>
          <span className={`timer-value ${timeRemaining < 300 ? 'warning' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          Question {currentQuestionIndex + 1} of {questions.length} • {answeredCount} answered
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">Question {currentQuestionIndex + 1}</span>
            <span className={`difficulty-badge ${currentQuestion.question.difficulty}`}>
              {currentQuestion.question.difficulty}
            </span>
          </div>

          <h2 className="question-text">{currentQuestion.question.text}</h2>

          <div className="options-list">
            {currentQuestion.question.options.map((option, index) => (
              <label
                key={index}
                className={`option-item ${answers[currentQuestion.question.id] === String(index) ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.question.id}`}
                  value={index}
                  checked={answers[currentQuestion.question.id] === String(index)}
                  onChange={() => handleAnswerSelect(currentQuestion.question.id, String(index))}
                />
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="navigation-buttons">
          <button
            className="btn-secondary"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            ← Previous
          </button>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              className="btn-primary"
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-submit"
              onClick={handleSubmitQuiz}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

        <div className="question-navigator">
          <h3>Questions</h3>
          <div className="question-grid">
            {questions.map((q, index) => (
              <button
                key={q.question.id}
                className={`question-nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${answers[q.question.id] ? 'answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuizPage;
