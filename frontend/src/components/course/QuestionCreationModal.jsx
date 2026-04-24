import React, { useState } from 'react'
import { questionsAPI } from '../../services/api'
import './QuestionBankModal.css'

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice', hasOptions: true },
  { value: 'true_false', label: 'True/False', hasOptions: false },
  { value: 'short_answer', label: 'Short Answer', hasOptions: false },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
]

const SUBJECT_OPTIONS = [
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'devops', label: 'DevOps' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'networking', label: 'Networking' },
  { value: 'software_development', label: 'Software Development' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export default function QuestionCreationModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    text: '',
    question_type: 'mcq',
    language: 'en',
    subject: 'cybersecurity',
    difficulty: 'medium',
    points: 1,
    options: ['', '', '', ''],
    correct_answer: '0',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const hasOptions = QUESTION_TYPES.find(t => t.value === form.question_type)?.hasOptions
  const isTrueFalse = form.question_type === 'true_false'

  const handleOptionChange = (index, value) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === index ? value : o)
    }))
  }

  const handleAddOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, ''] }))
  }

  const handleRemoveOption = (index) => {
    if (form.options.length <= 2) return
    setForm(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index)
      // Adjust correct_answer if needed
      let newCorrect = prev.correct_answer
      if (parseInt(prev.correct_answer) >= index && parseInt(prev.correct_answer) > 0) {
        newCorrect = String(parseInt(prev.correct_answer) - 1)
      }
      if (parseInt(newCorrect) >= newOptions.length) {
        newCorrect = String(newOptions.length - 1)
      }
      return { ...prev, options: newOptions, correct_answer: newCorrect }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!form.text.trim()) {
      setError('Question text is required')
      return
    }
    
    if (hasOptions && form.options.some(o => !o.trim())) {
      setError('All options must be filled')
      return
    }
    
    setSaving(true)
    
    try {
      const hasToken = !!localStorage.getItem('access_token')
      
      if (!hasToken) {
        // Demo mode - create mock question
        const mockQuestion = {
          id: Date.now(),
          text: form.text,
          question_type: form.question_type,
          type_display: QUESTION_TYPES.find(t => t.value === form.question_type)?.label,
          language: form.language,
          language_display: LANGUAGE_OPTIONS.find(l => l.value === form.language)?.label,
          difficulty: form.difficulty,
          difficulty_display: DIFFICULTY_OPTIONS.find(d => d.value === form.difficulty)?.label,
          subject: form.subject,
          subject_display: SUBJECT_OPTIONS.find(s => s.value === form.subject)?.label,
          options: hasOptions ? form.options.filter(o => o.trim()) : [],
          correct_answer: form.correct_answer,
          points: form.points,
        }
        onSave(mockQuestion)
        return
      }
      
      // Real backend
      const payload = {
        text: form.text,
        question_type: form.question_type,
        language: form.language,
        subject: form.subject,
        difficulty: form.difficulty,
        points: form.points,
      }
      
      if (hasOptions) {
        payload.options = form.options.filter(o => o.trim())
        payload.correct_answer = form.correct_answer
      } else if (isTrueFalse) {
        payload.correct_answer = form.correct_answer === 'true' ? 'true' : 'false'
      } else {
        payload.correct_answer = form.correct_answer
      }
      
      const res = await questionsAPI.create(payload)
      onSave(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create question')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="qb-modal-overlay" onClick={onClose}>
      <div className="qb-modal" onClick={e => e.stopPropagation()}>
        <div className="qb-modal-header">
          <h3>✨ Create New Question</h3>
          <button className="qb-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="qb-form">
          {error && (
            <div className="qb-error">{error}</div>
          )}
          
          <div className="qb-form-group">
            <label className="qb-label">Question Text</label>
            <textarea
              className="qb-textarea"
              value={form.text}
              onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              placeholder="Enter your question here..."
              rows={3}
            />
          </div>
          
          <div className="qb-form-row">
            <div className="qb-form-group">
              <label className="qb-label">Question Type</label>
              <select
                className="qb-select"
                value={form.question_type}
                onChange={e => setForm(p => ({ 
                  ...p, 
                  question_type: e.target.value,
                  options: e.target.value === 'mcq' ? ['', '', '', ''] : [],
                  correct_answer: e.target.value === 'mcq' ? '0' : 'true'
                }))}
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            <div className="qb-form-group">
              <label className="qb-label">Language</label>
              <select
                className="qb-select"
                value={form.language}
                onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
              >
                {LANGUAGE_OPTIONS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="qb-form-row">
            <div className="qb-form-group">
              <label className="qb-label">Subject</label>
              <select
                className="qb-select"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              >
                {SUBJECT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            
            <div className="qb-form-group">
              <label className="qb-label">Difficulty</label>
              <select
                className="qb-select"
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            
            <div className="qb-form-group qb-small">
              <label className="qb-label">Points</label>
              <input
                type="number"
                className="qb-input"
                min={1}
                max={10}
                value={form.points}
                onChange={e => setForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          
          {hasOptions && (
            <div className="qb-form-group">
              <label className="qb-label">Options</label>
              <div className="qb-options-list">
                {form.options.map((option, index) => (
                  <div key={index} className="qb-option-row">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={form.correct_answer === String(index)}
                      onChange={() => setForm(p => ({ ...p, correct_answer: String(index) }))}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      className="qb-input"
                      value={option}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        className="qb-btn-icon"
                        onClick={() => handleRemoveOption(index)}
                        title="Remove option"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="qb-btn-add"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            </div>
          )}
          
          {isTrueFalse && (
            <div className="qb-form-group">
              <label className="qb-label">Correct Answer</label>
              <div className="qb-radio-group">
                <label className="qb-radio">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="true"
                    checked={form.correct_answer === 'true'}
                    onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}
                  />
                  <span>True</span>
                </label>
                <label className="qb-radio">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="false"
                    checked={form.correct_answer === 'false'}
                    onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}
          
          {!hasOptions && !isTrueFalse && (
            <div className="qb-form-group">
              <label className="qb-label">Correct Answer / Expected Response</label>
              <input
                type="text"
                className="qb-input"
                value={form.correct_answer}
                onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}
                placeholder="Enter expected answer..."
              />
            </div>
          )}
          
          <div className="qb-modal-footer">
            <button type="button" className="qb-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="qb-btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
