import React, { useState, useEffect, useCallback } from 'react'
import { questionsAPI } from '../../services/api'
import './QuestionBankModal.css'

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
]

const SUBJECT_OPTIONS = [
  { value: '', label: 'All Subjects' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'devops', label: 'DevOps' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'networking', label: 'Networking' },
  { value: 'software_development', label: 'Software Dev' },
]

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export default function QuestionBankModal({ language, selectedIds = [], onSelect, onClose }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set(selectedIds))
  const [filters, setFilters] = useState({ language: language || '', subject: '', difficulty: '', search: '' })
  const [count, setCount] = useState(0)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.language) params.language = filters.language
      if (filters.subject) params.subject = filters.subject
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.search) params.search = filters.search
      const res = await questionsAPI.list(params)
      setQuestions(res.data.results || res.data || [])
      setCount(res.data.count || (res.data?.length) || 0)
    } catch { setQuestions([]) }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(fetchQuestions, 300)
    return () => clearTimeout(timer)
  }, [fetchQuestions])

  const toggleQuestion = (q) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.add(q.id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map(q => q.id)))
    }
  }

  const handleConfirm = () => {
    const selectedQuestions = questions.filter(q => selected.has(q.id))
    onSelect(selectedQuestions)
  }

  const diffColor = (d) => d === 'easy' ? '#22c55e' : d === 'hard' ? '#ef4444' : '#f59e0b'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content qb-modal">
        {/* Header */}
        <div className="qb-header">
          <div>
            <h2>Question Bank</h2>
            <p>{count} question{count !== 1 ? 's' : ''} available</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="qb-filters">
          {/* Search */}
          <div className="qb-search">
            <svg width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="qb-search-input"
              placeholder="Search questions..."
              value={filters.search}
              onChange={e => setFilters(p => ({...p, search: e.target.value}))}
            />
          </div>

          {/* Language Filter */}
          <div className="qb-filter-group">
            <label className="form-label">🌐 Language</label>
            <select
              className="form-select"
              value={filters.language}
              onChange={e => setFilters(p => ({...p, language: e.target.value}))}
            >
              {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="qb-filter-group">
            <label className="form-label">📚 Subject</label>
            <select
              className="form-select"
              value={filters.subject}
              onChange={e => setFilters(p => ({...p, subject: e.target.value}))}
            >
              {SUBJECT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="qb-filter-group">
            <label className="form-label">⚡ Difficulty</label>
            <select
              className="form-select"
              value={filters.difficulty}
              onChange={e => setFilters(p => ({...p, difficulty: e.target.value}))}
            >
              {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Selected count */}
        <div className="qb-selection-bar">
          <label className="qb-select-all">
            <input
              type="checkbox"
              checked={questions.length > 0 && selected.size === questions.length}
              onChange={toggleAll}
              style={{accentColor:'var(--accent-blue)'}}
            />
            <span>Select All ({questions.length})</span>
          </label>
          <span className="qb-selected-count">{selected.size} selected</span>
        </div>

        {/* Questions List */}
        <div className="qb-list">
          {loading ? (
            <div className="qb-loading">
              <div className="spinner" />
              <span>Loading questions...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="qb-empty">
              <span>🔍</span>
              <p>No questions found. Try adjusting the filters.</p>
            </div>
          ) : (
            questions.map(q => (
              <div
                key={q.id}
                className={`qb-question-item ${selected.has(q.id) ? 'selected' : ''}`}
                onClick={() => toggleQuestion(q)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(q.id)}
                  onChange={() => toggleQuestion(q)}
                  onClick={e => e.stopPropagation()}
                  style={{accentColor:'var(--accent-blue)', width:16, height:16, flexShrink:0}}
                />
                <div className="qb-q-content">
                  <p className="qb-q-text">{q.text}</p>
                  <div className="qb-q-meta">
                    <span className="qb-q-badge qb-q-type">{q.type_display || q.question_type}</span>
                    <span className="qb-q-badge" style={{color: diffColor(q.difficulty), background: `${diffColor(q.difficulty)}18`, borderColor: `${diffColor(q.difficulty)}40`}}>
                      {q.difficulty_display || q.difficulty}
                    </span>
                    <span className="qb-q-badge qb-q-lang">🌐 {q.language_display || q.language}</span>
                    <span className="qb-q-badge qb-q-subject">{q.subject_display || q.subject}</span>
                    <span className="qb-q-points">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                  </div>
                  {q.question_type === 'mcq' && q.options?.length > 0 && (
                    <div className="qb-q-options">
                      {q.options.map((opt, i) => (
                        <span key={i} className={`qb-q-option ${String(i) === q.correct_answer ? 'correct' : ''}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="qb-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            Add {selected.size} Question{selected.size !== 1 ? 's' : ''} to Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
