import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './AssessmentCreationPage.css';

const AssessmentCreationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL for edit mode
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    time_limit_minutes: 30,
    passing_score: 70,
    max_attempts: 3,
    randomize_questions: false,
    show_correct_answers: true,
    is_active: true,
    assigned_trainer_ids: []
  });

  const [filters, setFilters] = useState({
    language: '',
    difficulty: '',
    subject: '',
    search: ''
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCourses(),
          fetchQuestions(),
          fetchTrainers()
        ]);
        
        // If edit mode, fetch existing quiz data
        if (isEditMode) {
          await fetchQuizData();
        }
      } catch (err) {
        console.error('Error initializing page:', err);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();
  }, [id]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return;
      }
      const response = await fetch('http://localhost:8000/api/courses/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCourses(data.results || data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return;
      }
      const response = await fetch('http://localhost:8000/api/assessments/quizzes/trainers/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
      setTrainers([]);
    }
  };

  const fetchQuizData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      
      // Fetch quiz details
      const response = await fetch(`http://localhost:8000/api/assessments/quizzes/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const quiz = await response.json();
      
      // Populate form data
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        course: quiz.course || '',
        time_limit_minutes: quiz.time_limit_minutes || 30,
        passing_score: quiz.passing_score || 70,
        max_attempts: quiz.max_attempts || 3,
        randomize_questions: quiz.randomize_questions || false,
        show_correct_answers: quiz.show_correct_answers || true,
        is_active: quiz.is_active !== undefined ? quiz.is_active : true,
        assigned_trainer_ids: quiz.assigned_trainers || []
      });
      
      // Populate selected questions
      if (quiz.quiz_questions && quiz.quiz_questions.length > 0) {
        const questionsWithDetails = quiz.quiz_questions.map(qq => ({
          ...qq.question,
          order: qq.order,
          points: qq.points,
          quiz_question_id: qq.id
        }));
        setSelectedQuestions(questionsWithDetails);
      }
      
    } catch (error) {
      console.error('Error fetching quiz data:', error);
      setError('Failed to load quiz data');
      throw error;
    }
  };

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No access token found');
        return;
      }
      const params = new URLSearchParams();
      if (filters.language) params.append('language', filters.language);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`http://localhost:8000/api/questions/?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setQuestions(data.results || data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTrainerToggle = (trainerId) => {
    setFormData(prev => {
      const currentTrainers = prev.assigned_trainer_ids || [];
      const isSelected = currentTrainers.includes(trainerId);
      
      return {
        ...prev,
        assigned_trainer_ids: isSelected
          ? currentTrainers.filter(id => id !== trainerId)
          : [...currentTrainers, trainerId]
      };
    });
  };


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleQuestionSelection = (question) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      } else {
        return [...prev, { ...question, order: prev.length + 1, points: 10 }];
      }
    });
  };

  const updateQuestionPoints = (questionId, points) => {
    setSelectedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, points: parseInt(points) } : q)
    );
  };

  const reorderQuestion = (questionId, direction) => {
    setSelectedQuestions(prev => {
      const index = prev.findIndex(q => q.id === questionId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newArray = [...prev];
      [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
      return newArray.map((q, idx) => ({ ...q, order: idx + 1 }));
    });
  };

  const removeQuestion = (questionId) => {
    setSelectedQuestions(prev =>
      prev.filter(q => q.id !== questionId).map((q, idx) => ({ ...q, order: idx + 1 }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = isEditMode 
        ? `http://localhost:8000/api/assessments/quizzes/${id}/`
        : 'http://localhost:8000/api/assessments/quizzes/';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Create or update quiz
      const quizResponse = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          course: formData.course || null
        })
      });

      if (!quizResponse.ok) {
        const errorData = await quizResponse.json();
        throw new Error(errorData.detail || 'Failed to save quiz');
      }
      
      const quiz = await quizResponse.json();

      // If editing, first remove all existing questions
      if (isEditMode) {
        // We'll just add all questions fresh - backend should handle duplicates
      }

      // Add questions to quiz
      for (const question of selectedQuestions) {
        await fetch(`http://localhost:8000/api/assessments/quizzes/${quiz.id}/add_question/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question_id: question.id,
            order: question.order,
            points: question.points
          })
        });
      }

      alert(isEditMode ? 'Assessment updated successfully!' : 'Assessment created successfully!');
      navigate('/assessments');
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} assessment: ${error.message}`);
    }
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

  if (loading) {
    return (
      <div className="assessment-creation-page">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-creation-page">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>❌</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/assessments')} style={{ marginTop: '1rem' }}>
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-creation-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Assessment' : 'Create Assessment'}</h1>
        <button className="btn-secondary" onClick={() => navigate('/assessments')}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="assessment-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Python Programming Fundamentals"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Brief description of the assessment"
            />
          </div>

          <div className="form-group">
            <label>Course (Optional)</label>
            <select name="course" value={formData.course} onChange={handleInputChange}>
              <option value="">-- Select Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assign Trainers (Optional)</label>
            <div className="trainers-selection">
              {trainers.length === 0 ? (
                <p className="no-trainers">No trainers available</p>
              ) : (
                <div className="trainers-list">
                  {trainers.map(trainer => (
                    <label key={trainer.id} className="trainer-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.assigned_trainer_ids.includes(trainer.id)}
                        onChange={() => handleTrainerToggle(trainer.id)}
                      />
                      <div className="trainer-info">
                        <span className="trainer-name">{trainer.name}</span>
                        <span className="trainer-email">{trainer.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Settings */}
        <div className="form-section">
          <h2>Assessment Settings</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input
                type="number"
                name="time_limit_minutes"
                value={formData.time_limit_minutes}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Passing Score (%)</label>
              <input
                type="number"
                name="passing_score"
                value={formData.passing_score}
                onChange={handleInputChange}
                min="0"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Max Attempts</label>
              <input
                type="number"
                name="max_attempts"
                value={formData.max_attempts}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="randomize_questions"
                checked={formData.randomize_questions}
                onChange={handleInputChange}
              />
              <span>Randomize question order</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="show_correct_answers"
                checked={formData.show_correct_answers}
                onChange={handleInputChange}
              />
              <span>Show correct answers after submission</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <span>Active (visible to students)</span>
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="form-section">
          <div className="section-header">
            <h2>Questions ({selectedQuestions.length})</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowQuestionModal(true)}
            >
              + Add Questions
            </button>
          </div>

          {selectedQuestions.length === 0 ? (
            <div className="empty-state">
              <p>No questions added yet. Click "Add Questions" to select from question bank.</p>
            </div>
          ) : (
            <div className="selected-questions">
              <div className="questions-summary">
                <span>Total Questions: {selectedQuestions.length}</span>
                <span>Total Points: {totalPoints}</span>
              </div>

              <div className="questions-list">
                {selectedQuestions.map((question, index) => (
                  <div key={question.id} className="question-item">
                    <div className="question-order">
                      <span>Q{question.order}</span>
                      <div className="order-controls">
                        <button
                          type="button"
                          onClick={() => reorderQuestion(question.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => reorderQuestion(question.id, 'down')}
                          disabled={index === selectedQuestions.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <div className="question-content">
                      <p className="question-text">{question.text}</p>
                      <div className="question-meta">
                        <span className={`badge badge-${question.difficulty}`}>
                          {question.difficulty}
                        </span>
                        <span className="badge">{question.question_type}</span>
                        <span className="badge">{question.language_display || question.language}</span>
                      </div>
                    </div>

                    <div className="question-points">
                      <label>Points:</label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestionPoints(question.id, e.target.value)}
                        min="1"
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeQuestion(question.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/assessments')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={selectedQuestions.length === 0}>
            {isEditMode ? 'Update Assessment' : 'Create Assessment'}
          </button>
        </div>
      </form>


      {/* Question Selection Modal */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Questions from Bank</h2>
              <button className="btn-close" onClick={() => setShowQuestionModal(false)}>✕</button>
            </div>

            <div className="modal-filters">
              <input
                type="text"
                name="search"
                placeholder="Search questions..."
                value={filters.search}
                onChange={handleFilterChange}
              />

              <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select name="subject" value={filters.subject} onChange={handleFilterChange}>
                <option value="">All Subjects</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="cloud_computing">Cloud Computing</option>
                <option value="devops">DevOps</option>
                <option value="data_science">Data Science</option>
                <option value="software_development">Software Development</option>
              </select>

              <select name="language" value={filters.language} onChange={handleFilterChange}>
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
              </select>

              <button className="btn-primary" onClick={fetchQuestions}>Apply Filters</button>
            </div>

            <div className="modal-body">
              <div className="questions-grid">
                {questions.map(question => {
                  const isSelected = selectedQuestions.some(q => q.id === question.id);
                  return (
                    <div
                      key={question.id}
                      className={`question-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleQuestionSelection(question)}
                    >
                      <div className="question-card-header">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                        />
                        <div className="question-badges">
                          <span className={`badge badge-${question.difficulty}`}>
                            {question.difficulty}
                          </span>
                          <span className="badge">{question.question_type}</span>
                        </div>
                      </div>
                      <p className="question-card-text">{question.text}</p>
                      <div className="question-card-footer">
                        <span>{question.language_display || question.language}</span>
                        <span>{question.points} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <p>{selectedQuestions.length} questions selected</p>
              <button className="btn-primary" onClick={() => setShowQuestionModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentCreationPage;
