import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssessmentsListPage.css';

const AssessmentsListPage = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/assessments/quizzes/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAssessments(data.results || data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssessment = async (id) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`http://localhost:8000/api/assessments/quizzes/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading assessments...</div>;
  }

  return (
    <div className="assessments-list-page">
      <div className="page-header">
        <h1>Assessments</h1>
        <button className="btn-primary" onClick={() => navigate('/assessments/create')}>
          + Create Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="empty-state">
          <h2>No assessments yet</h2>
          <p>Create your first assessment to get started</p>
          <button className="btn-primary" onClick={() => navigate('/assessments/create')}>
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="assessments-grid">
          {assessments.map(assessment => (
            <div key={assessment.id} className="assessment-card">
              <div className="card-header">
                <h3>{assessment.title}</h3>
                <span className={`status-badge ${assessment.is_active ? 'active' : 'inactive'}`}>
                  {assessment.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="card-description">{assessment.description}</p>

              {assessment.assigned_trainer_names && assessment.assigned_trainer_names.length > 0 && (
                <div className="assigned-trainers">
                  <span className="trainers-label">Assigned Trainers:</span>
                  <div className="trainers-tags">
                    {assessment.assigned_trainer_names.map(trainer => (
                      <span key={trainer.id} className="trainer-tag" title={trainer.email}>
                        {trainer.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Questions</span>
                  <span className="stat-value">{assessment.total_questions || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Points</span>
                  <span className="stat-value">{assessment.total_points || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Time Limit</span>
                  <span className="stat-value">{assessment.time_limit_minutes} min</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Passing</span>
                  <span className="stat-value">{assessment.passing_score}%</span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/assessments/${assessment.id}`)}
                >
                  View Details
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/assessments/${assessment.id}/edit`)}
                >
                  Edit
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => deleteAssessment(assessment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentsListPage;
