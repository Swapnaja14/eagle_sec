import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AssessmentDetailPage.css';

const AssessmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/assessments/quizzes/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assessment');
      }
      
      const data = await response.json();
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/assessments/quizzes/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Assessment deleted successfully');
      navigate('/assessments');
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert('Failed to delete assessment');
    }
  };

  if (loading) {
    return (
      <div className="assessment-detail-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="assessment-detail-page">
        <div className="error">{error || 'Assessment not found'}</div>
        <button className="btn-primary" onClick={() => navigate('/assessments')}>
          Back to Assessments
        </button>
      </div>
    );
  }

  return (
    <div className="assessment-detail-page">
      <div className="page-header">
        <div>
          <h1>{assessment.title}</h1>
          <span className={`status-badge ${assessment.is_active ? 'active' : 'inactive'}`}>
            {assessment.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/assessments')}>
            Back
          </button>
          <button className="btn-primary" onClick={() => navigate(`/assessments/${id}/edit`)}>
            Edit
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h2>Description</h2>
          <p>{assessment.description || 'No description provided'}</p>
        </div>

        <div className="detail-section">
          <h2>Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Time Limit</span>
              <span className="setting-value">{assessment.time_limit_minutes} minutes</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Passing Score</span>
              <span className="setting-value">{assessment.passing_score}%</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Max Attempts</span>
              <span className="setting-value">{assessment.max_attempts}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Randomize Questions</span>
              <span className="setting-value">{assessment.randomize_questions ? 'Yes' : 'No'}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Show Correct Answers</span>
              <span className="setting-value">{assessment.show_correct_answers ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {assessment.assigned_trainer_names && assessment.assigned_trainer_names.length > 0 && (
          <div className="detail-section">
            <h2>Assigned Trainers</h2>
            <div className="trainers-list">
              {assessment.assigned_trainer_names.map(trainer => (
                <div key={trainer.id} className="trainer-card">
                  <div className="trainer-avatar">{trainer.name.charAt(0)}</div>
                  <div className="trainer-info">
                    <div className="trainer-name">{trainer.name}</div>
                    <div className="trainer-email">{trainer.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2>Questions ({assessment.total_questions})</h2>
          <div className="questions-summary">
            <div className="summary-item">
              <span className="summary-label">Total Questions</span>
              <span className="summary-value">{assessment.total_questions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Points</span>
              <span className="summary-value">{assessment.total_points}</span>
            </div>
          </div>

          {assessment.quiz_questions && assessment.quiz_questions.length > 0 && (
            <div className="questions-list">
              {assessment.quiz_questions.map((qq, index) => (
                <div key={qq.id} className="question-preview">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-content">
                    <p className="question-text">{qq.question.text}</p>
                    <div className="question-meta">
                      <span className={`badge badge-${qq.question.difficulty}`}>
                        {qq.question.difficulty}
                      </span>
                      <span className="badge">{qq.question.question_type}</span>
                      <span className="badge">{qq.points} points</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDetailPage;
