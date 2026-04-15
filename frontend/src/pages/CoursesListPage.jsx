import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './CoursesListPage.css'

const MOCK_COURSES = [
  { id: 'mock-1', course_id: 'CS-DEMO-001', display_name: 'PSARA Foundation Course', description: 'Core PSARA compliance training for all security personnel.', status: 'active', compliance_taxonomy: 'none', skills_taxonomy: 'none', lesson_count: 4, created_at: new Date().toISOString() },
  { id: 'mock-2', course_id: 'CS-DEMO-002', display_name: 'Fire Safety & Evacuation', description: 'Emergency response and fire safety procedures.', status: 'active', compliance_taxonomy: 'ISO 27001', skills_taxonomy: 'Incident Response', lesson_count: 3, created_at: new Date().toISOString() },
  { id: 'mock-3', course_id: 'CS-DEMO-003', display_name: 'Digital Security Awareness', description: 'Cybersecurity fundamentals for non-technical staff.', status: 'draft', compliance_taxonomy: 'GDPR', skills_taxonomy: 'Threat Analysis', lesson_count: 2, created_at: new Date().toISOString() },
]

export default function CoursesListPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const navigate = useNavigate()
  const { isRealUser } = useAuth()

  const fetchCourses = async () => {
    setLoading(true)
    if (!isRealUser) {
      let results = [...MOCK_COURSES]
      if (search) results = results.filter(c => c.display_name.toLowerCase().includes(search.toLowerCase()))
      if (filterStatus) results = results.filter(c => c.status === filterStatus)
      setCourses(results)
      setLoading(false)
      return
    }
    try {
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      const res = await coursesAPI.list(params)
      setCourses(res.data.results || [])
    } catch { setCourses([]) }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timer)
  }, [search, filterStatus])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return
    if (!isRealUser) { setCourses(prev => prev.filter(c => c.id !== id)); return }
    try {
      await coursesAPI.delete(id)
      setCourses(prev => prev.filter(c => c.id !== id))
    } catch { alert('Failed to delete.') }
  }

  return (
    <div className="cls-page">
      <div className="cls-header">
        <div className="cls-header-inner">
          <div>
            <h1>Course Builder</h1>
            <p>Create and manage training courses for your organization.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>
            + New Course
          </button>
        </div>
      </div>

      <div className="cls-body">
        {/* Filters */}
        <div className="cls-filters">
          <div className="cls-search">
            <svg width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="cls-search-input"
              placeholder="Quick search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{width:160}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="cls-loading">
            <div className="spinner" style={{width:36,height:36}} />
          </div>
        ) : courses.length === 0 ? (
          <div className="cls-empty">
            <span>🎓</span>
            <h3>No courses yet</h3>
            <p>Create your first training course to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/courses/new')}>Create Course</button>
          </div>
        ) : (
          <div className="cls-grid">
            {courses.map(course => (
              <div key={course.id} className="cls-card card">
                <div className="cls-card-top">
                  <span className={`badge ${course.status === 'active' ? 'badge-active' : course.status === 'retired' ? 'badge-retired' : 'badge-draft'}`}>
                    {course.status}
                  </span>
                  <span className="cls-card-id">ID: {course.course_id}</span>
                </div>
                <h3 className="cls-card-name">{course.display_name}</h3>
                {course.description && (
                  <p className="cls-card-desc">{course.description.slice(0, 100)}{course.description.length > 100 ? '...' : ''}</p>
                )}
                <div className="cls-card-tags">
                  {course.compliance_taxonomy !== 'none' && <span className="chip">{course.compliance_taxonomy}</span>}
                  {course.skills_taxonomy !== 'none' && <span className="chip">{course.skills_taxonomy}</span>}
                </div>
                <div className="cls-card-stats">
                  <span>📚 {course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}</span>
                  <span>📅 {new Date(course.created_at).toLocaleDateString()}</span>
                </div>
                <div className="cls-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/courses/${course.id}/builder`)}>
                    Open Builder
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(course.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
