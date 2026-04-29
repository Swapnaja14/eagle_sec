import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentsAPI } from '../services/api';
import './QuizResultsPage.css';

const QuizResultsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    page_size: 20,
    total_pages: 1
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    passed: '',
    date_from: '',
    date_to: '',
    ordering: '-submitted_at'
  });

  useEffect(() => {
    fetchSubmissions();
  }, [pagination.page, filters.status, filters.passed, filters.ordering]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await assessmentsAPI.allSubmissions(params);
      setSubmissions(response.data.results || []);
      setPagination(prev => ({
        ...prev,
        count: response.data.count,
        total_pages: response.data.total_pages
      }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.response?.data?.error || 'Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSubmissions();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      passed: '',
      date_from: '',
      date_to: '',
      ordering: '-submitted_at'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (error) {
    return (
      <div className="quiz-results-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error Loading Results</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchSubmissions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-results-page">
      <div className="quiz-results-header">
        <div className="header-left">
          <h1>📋 Quiz Results</h1>
          <p className="subtitle">View and analyze all quiz submissions</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{pagination.count}</span>
            <span className="stat-label">Total Submissions</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by trainee name or quiz title..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-secondary">🔍 Search</button>
        </form>

        <div className="filter-row">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="expired">Expired</option>
          </select>

          <select
            value={filters.passed}
            onChange={(e) => handleFilterChange('passed', e.target.value)}
            className="filter-select"
          >
            <option value="">All Results</option>
            <option value="true">Passed</option>
            <option value="false">Failed</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="filter-date"
            placeholder="From Date"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="filter-date"
            placeholder="To Date"
          />

          <select
            value={filters.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="filter-select"
          >
            <option value="-submitted_at">Latest First</option>
            <option value="submitted_at">Oldest First</option>
            <option value="-percentage">Highest Score</option>
            <option value="percentage">Lowest Score</option>
          </select>

          <button onClick={clearFilters} className="btn-ghost">Clear Filters</button>
        </div>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading quiz results...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Submissions Found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <>
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Attempt</th>
                  <th>Time Taken</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className={submission.passed ? 'passed-row' : 'failed-row'}>
                    <td>
                      <div className="trainee-cell">
                        <span className="trainee-name">
                          {submission.user?.first_name} {submission.user?.last_name}
                        </span>
                        <span className="trainee-username">@{submission.user?.username}</span>
                        {submission.user?.department && (
                          <span className="trainee-dept">{submission.user.department}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="quiz-title">{submission.quiz?.title || 'Unknown Quiz'}</span>
                    </td>
                    <td>
                      <div className={`score-cell ${submission.passed ? 'passed' : 'failed'}`}>
                        <span className="score-percentage">{submission.percentage?.toFixed(1)}%</span>
                        <span className="score-fraction">{submission.score}/{submission.total_points}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${submission.status} ${submission.passed ? 'passed' : 'failed'}`}>
                        {submission.status === 'completed'
                          ? (submission.passed ? '✅ Passed' : '❌ Failed')
                          : submission.status}
                      </span>
                    </td>
                    <td>#{submission.attempt_number}</td>
                    <td>{formatDuration(submission.time_taken_seconds)}</td>
                    <td>{formatDate(submission.submitted_at)}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/assessments/submissions/${submission.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-pagination"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.total_pages}
              className="btn-pagination"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizResultsPage;
