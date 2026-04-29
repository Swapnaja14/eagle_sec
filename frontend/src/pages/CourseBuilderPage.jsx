import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesAPI, questionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import QuestionBankModal from '../components/course/QuestionBankModal'
import './CourseBuilderPage.css'

const LEVELS = [
  { id: 1, label: 'Global Metadata', icon: 'ℹ️' },
  { id: 2, label: 'Pre-Assessment', icon: '📋' },
  { id: 3, label: 'Lessons & Content', icon: '📑' },
  { id: 4, label: 'Post-Assessment', icon: '✅' },
  { id: 5, label: 'Certification', icon: '🎓' },
  { id: 6, label: 'Timeline & Expiry', icon: '⏱️' },
]

const COMPLIANCE_OPTIONS = ['none', 'ISO 27001', 'SOC2', 'GDPR', 'HIPAA', 'PCI-DSS', 'NIST']
const SKILL_OPTIONS = ['none', 'Threat Analysis', 'Incident Response', 'Penetration Testing', 'Cloud Architecture', 'DevSecOps', 'Risk Management', 'Python', 'Kubernetes']
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
]

export default function CourseBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isRealUser } = useAuth()
  const [activeLevel, setActiveLevel] = useState(1)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)

  // Level 1 — Global Metadata
  const [meta, setMeta] = useState({
    display_name: '', description: '', start_date: '', end_date: '',
    compliance_taxonomy: 'none', skills_taxonomy: 'none',
  })

  // Level 2 — Pre-Assessment
  const [preAssess, setPreAssess] = useState({
    id: null, is_active: true, single_attempt: true, time_limit_minutes: 45, language: 'en',
    question_count: 10, randomize: false, questions: [],
  })

  // Level 3 — Lessons
  const [lessons, setLessons] = useState([])
  const [expandedLessons, setExpandedLessons] = useState({})
  const [newLessonTitle, setNewLessonTitle] = useState('')

  // Level 4 — Post-Assessment
  const [postAssess, setPostAssess] = useState({
    id: null, is_active: true, passing_threshold: 85, max_attempts: 2, language: 'en',
    question_count: 10, randomize: false, questions: [],
  })

  // Level 5 — Certification
  const [cert, setCert] = useState({
    id: null, template: 'corporate_modern',
    enable_soft_expiry: false, enable_recertification_reminder: true,
  })

  // Level 6 — Timeline
  const [batchExpiry, setBatchExpiry] = useState({ target_group: '', expiry_date: '' })

  // Question Bank Modal
  const [qbModal, setQbModal] = useState({ open: false, for: null }) // 'pre' | 'post'

  const fileInputRef = useRef()
  const [lessonFileTarget, setLessonFileTarget] = useState(null)

  const showNotif = useCallback((msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }, [])

  // Load existing course
  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await coursesAPI.get(id)
        const c = res.data
        setCourse(c)
        setMeta({
          display_name: c.display_name || '',
          description: c.description || '',
          start_date: c.start_date || '',
          end_date: c.end_date || '',
          compliance_taxonomy: c.compliance_taxonomy || 'none',
          skills_taxonomy: c.skills_taxonomy || 'none',
        })
        if (c.pre_assessment) {
          setPreAssess(prev => ({ ...prev, ...c.pre_assessment, questions: c.pre_assessment.questions || [] }))
        }
        if (c.lessons) setLessons(c.lessons)
        if (c.post_assessment) {
          setPostAssess(prev => ({ ...prev, ...c.post_assessment, questions: c.post_assessment.questions || [] }))
        }
        if (c.certification) setCert(prev => ({ ...prev, ...c.certification }))
      } catch { showNotif('Failed to load course.', 'error') }
      finally { setLoading(false) }
    }
    load()
  }, [id, showNotif])

  const handleSaveLevel = async () => {
    setSaving(true)
    try {
      // ── DEMO MODE: no real backend, simulate save locally ─────────────────
      if (!isRealUser) {
        if (activeLevel === 1) {
          if (!meta.display_name.trim()) { showNotif('Course name is required.', 'error'); setSaving(false); return }
          if (meta.start_date && meta.end_date && meta.end_date < meta.start_date) { showNotif('End date must be after start date.', 'error'); setSaving(false); return }
          if (!id && !course) {
            const mockCourse = {
              id: `mock-${Date.now()}`, course_id: `CS-DEMO-${Date.now().toString(36).toUpperCase()}`,
              ...meta, status: 'draft',
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              pre_assessment: { id: 1, is_active: true, single_attempt: true, time_limit_minutes: 45, language: 'en', question_count: 10, randomize: false, questions: [] },
              post_assessment: { id: 1, is_active: true, passing_threshold: 85, max_attempts: 2, language: 'en', question_count: 10, randomize: false, questions: [] },
              certification: { id: 1, template: 'corporate_modern', enable_soft_expiry: false, enable_recertification_reminder: true, batch_expiries: [] },
              lessons: [],
            }
            setCourse(mockCourse)
            setPreAssess(prev => ({ ...prev, ...mockCourse.pre_assessment }))
            setPostAssess(prev => ({ ...prev, ...mockCourse.post_assessment }))
            setCert(prev => ({ ...prev, ...mockCourse.certification }))
            navigate(`/courses/${mockCourse.id}/builder`, { replace: true })
            showNotif('Course created! (Demo mode)')
          } else {
            setCourse(prev => ({ ...prev, ...meta, updated_at: new Date().toISOString() }))
            showNotif('Metadata saved! (Demo mode)')
          }
        } else if (activeLevel === 2) {
          showNotif('Pre-Assessment saved! (Demo mode)')
        } else if (activeLevel === 3) {
          showNotif('Lessons saved! (Demo mode)')
        } else if (activeLevel === 4) {
          showNotif('Post-Assessment saved! (Demo mode)')
        } else if (activeLevel === 5) {
          showNotif('Certification settings saved! (Demo mode)')
        } else if (activeLevel === 6) {
          if (batchExpiry.target_group && batchExpiry.expiry_date) {
            setBatchExpiry({ target_group: '', expiry_date: '' })
          }
          showNotif('Settings saved! (Demo mode)')
        }
        setSaving(false)
        return
      }

      // ── REAL BACKEND ──────────────────────────────────────────────────────
      if (activeLevel === 1) {
        if (!meta.display_name.trim()) {
          showNotif('Course name is required.', 'error'); setSaving(false); return
        }
        if (meta.start_date && meta.end_date && meta.end_date < meta.start_date) {
          showNotif('End date must be after start date.', 'error'); setSaving(false); return
        }
        if (!id && !course) {
          const res = await coursesAPI.create(meta)
          const c = res.data
          setCourse(c)
          if (c.pre_assessment) setPreAssess(prev => ({ ...prev, ...c.pre_assessment, questions: c.pre_assessment.questions || [] }))
          if (c.post_assessment) setPostAssess(prev => ({ ...prev, ...c.post_assessment, questions: c.post_assessment.questions || [] }))
          if (c.certification) setCert(prev => ({ ...prev, ...c.certification }))
          navigate(`/courses/${c.id}/builder`, { replace: true })
          showNotif('Course created!')
        } else {
          const cid = course?.id || id
          const res = await coursesAPI.update(cid, meta)
          setCourse(prev => ({ ...prev, ...res.data }))
          showNotif('Metadata saved!')
        }
      } else if (activeLevel === 2) {
        const cid = course?.id || id
        if (!cid) { showNotif('Save course metadata first.', 'error'); setSaving(false); return }
        const assessId = preAssess.id
        if (!assessId) { showNotif('Pre-assessment not initialized. Save metadata first.', 'error'); setSaving(false); return }
        await coursesAPI.updatePreAssessment(cid, assessId, {
          is_active: preAssess.is_active,
          single_attempt: preAssess.single_attempt,
          time_limit_minutes: preAssess.time_limit_minutes,
          language: preAssess.language,
          question_count: preAssess.question_count,
          randomize: preAssess.randomize,
          question_ids: preAssess.questions.map(q => q.id),
        })
        showNotif('Pre-Assessment saved!')
      } else if (activeLevel === 4) {
        const cid = course?.id || id
        if (!cid) { showNotif('Save course metadata first.', 'error'); setSaving(false); return }
        const assessId = postAssess.id
        if (!assessId) { showNotif('Post-assessment not initialized. Save metadata first.', 'error'); setSaving(false); return }
        await coursesAPI.updatePostAssessment(cid, assessId, {
          is_active: postAssess.is_active,
          passing_threshold: postAssess.passing_threshold,
          max_attempts: postAssess.max_attempts,
          language: postAssess.language,
          question_count: postAssess.question_count,
          randomize: postAssess.randomize,
          question_ids: postAssess.questions.map(q => q.id),
        })
        showNotif('Post-Assessment saved!')
      } else if (activeLevel === 5) {
        const cid = course?.id || id
        if (!cid) { showNotif('Save course metadata first.', 'error'); setSaving(false); return }
        const certId = cert.id
        if (!certId) { showNotif('Certification not initialized. Save metadata first.', 'error'); setSaving(false); return }
        await coursesAPI.updateCertification(cid, certId, {
          template: cert.template,
          enable_soft_expiry: cert.enable_soft_expiry,
          enable_recertification_reminder: cert.enable_recertification_reminder,
        })
        showNotif('Certification settings saved!')
      } else if (activeLevel === 6) {
        const cid = course?.id || id
        if (!cid) { showNotif('Save course metadata first.', 'error'); setSaving(false); return }
        // Save policy overrides on certification
        if (cert.id) {
          await coursesAPI.updateCertification(cid, cert.id, {
            enable_soft_expiry: cert.enable_soft_expiry,
            enable_recertification_reminder: cert.enable_recertification_reminder,
          })
        }
        // Apply batch expiry if filled
        if (cert.id && batchExpiry.target_group && batchExpiry.expiry_date) {
          if (batchExpiry.expiry_date < new Date().toISOString().split('T')[0]) {
            showNotif('Expiry date must be in the future.', 'error'); setSaving(false); return
          }
          await coursesAPI.addBatchExpiry(cid, batchExpiry)
          setBatchExpiry({ target_group: '', expiry_date: '' })
          showNotif('Batch expiry applied and policy saved!')
        } else {
          showNotif('Policy settings saved!')
        }
      }
    } catch (err) {
      showNotif(err.response?.data?.detail || 'Save failed.', 'error')
    } finally { setSaving(false) }
  }

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return
    const cid = course?.id || id
    if (!cid) { showNotif('Save course metadata first.', 'error'); return }
    if (!isRealUser) {
      const mockLesson = { id: Date.now(), title: newLessonTitle, order: lessons.length + 1, files: [], created_at: new Date().toISOString() }
      setLessons(prev => [...prev, mockLesson])
      setNewLessonTitle('')
      return
    }
    try {
      const res = await coursesAPI.createLesson(cid, { title: newLessonTitle })
      setLessons(prev => [...prev, { ...res.data, files: [] }])
      setNewLessonTitle('')
    } catch { showNotif('Failed to add lesson.', 'error') }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return
    if (!isRealUser) { setLessons(prev => prev.filter(l => l.id !== lessonId)); return }
    const cid = course?.id || id
    try {
      await coursesAPI.deleteLesson(cid, lessonId)
      setLessons(prev => prev.filter(l => l.id !== lessonId))
    } catch { showNotif('Failed to delete lesson.', 'error') }
  }

  const handleUploadLessonFile = async (lessonId, file) => {
    if (!isRealUser) {
      const mockFile = { id: Date.now(), original_filename: file.name, file_type: file.name.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'document', language: 'en', allow_offline_download: false }
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, files: [...(l.files || []), mockFile] } : l))
      showNotif('File added! (Demo mode)')
      return
    }
    const cid = course?.id || id
    const formData = new FormData()
    formData.append('file', file)
    formData.append('original_filename', file.name)
    try {
      const res = await coursesAPI.uploadLessonFile(cid, lessonId, formData)
      setLessons(prev => prev.map(l =>
        l.id === lessonId ? { ...l, files: [...(l.files || []), res.data] } : l
      ))
      showNotif('File uploaded!')
    } catch { showNotif('File upload failed.', 'error') }
  }

  const handleDeleteLessonFile = async (lessonId, fileId) => {
    if (!isRealUser) {
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, files: (l.files || []).filter(f => f.id !== fileId) } : l))
      return
    }
    const cid = course?.id || id
    try {
      await coursesAPI.deleteLessonFile(cid, lessonId, fileId)
      setLessons(prev => prev.map(l =>
        l.id === lessonId ? { ...l, files: (l.files || []).filter(f => f.id !== fileId) } : l
      ))
      showNotif('File removed.')
    } catch { showNotif('Failed to remove file.', 'error') }
  }

  const handleToggleOffline = async (lessonId, fileId, currentValue) => {
    if (!isRealUser) {
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, files: l.files.map(f => f.id === fileId ? { ...f, allow_offline_download: !currentValue } : f) } : l))
      return
    }
    const cid = course?.id || id
    try {
      await coursesAPI.updateLessonFile(cid, lessonId, fileId, { allow_offline_download: !currentValue })
      setLessons(prev => prev.map(l =>
        l.id === lessonId
          ? { ...l, files: l.files.map(f => f.id === fileId ? { ...f, allow_offline_download: !currentValue } : f) }
          : l
      ))
    } catch { /* silent */ }
  }

  const handleRetire = async () => {
    const cid = course?.id || id
    if (!cid) return
    if (!isRealUser) { setCourse(prev => ({ ...prev, status: 'retired' })); showNotif('Course retired. (Demo mode)'); return }
    try {
      await coursesAPI.retire(cid)
      setCourse(prev => ({ ...prev, status: 'retired' }))
      showNotif('Course retired.')
    } catch { showNotif('Failed to retire.', 'error') }
  }

  const handleActivate = async () => {
    const cid = course?.id || id
    if (!cid) return
    if (!isRealUser) { setCourse(prev => ({ ...prev, status: 'active' })); showNotif('Course activated. (Demo mode)'); return }
    try {
      await coursesAPI.activate(cid)
      setCourse(prev => ({ ...prev, status: 'active' }))
      showNotif('Course activated.')
    } catch { showNotif('Failed to activate.', 'error') }
  }

  const handleClone = async () => {
    const cid = course?.id || id
    if (!cid) return
    if (!isRealUser) {
      showNotif('Clone not available in demo mode.')
      return
    }
    try {
      const res = await coursesAPI.clone(cid)
      showNotif('Course cloned!')
      navigate(`/courses/${res.data.id}/builder`)
    } catch { showNotif('Clone failed.', 'error') }
  }

  const handleFinish = async () => {
    const cid = course?.id || id
    if (!cid) { showNotif('Save course metadata first.', 'error'); return }
    if (!meta.display_name.trim()) { showNotif('Course name is required before publishing.', 'error'); return }
    if (lessons.length === 0) { showNotif('Add at least one lesson before publishing.', 'error'); return }
    if (!isRealUser) {
      setCourse(prev => ({ ...prev, status: 'active' }))
      showNotif('Course published! 🎉 (Demo mode)')
      setTimeout(() => navigate('/courses'), 1500)
      return
    }
    try {
      await coursesAPI.update(cid, { status: 'active' })
      setCourse(prev => ({ ...prev, status: 'active' }))
      showNotif('Course published successfully! 🎉')
      setTimeout(() => navigate('/courses'), 1500)
    } catch { showNotif('Failed to publish.', 'error') }
  }

  const handleQbSelect = (selectedQuestions) => {
    if (qbModal.for === 'pre') {
      setPreAssess(prev => ({ ...prev, questions: selectedQuestions }))
    } else {
      setPostAssess(prev => ({ ...prev, questions: selectedQuestions }))
    }
    setQbModal({ open: false, for: null })
    showNotif(`${selectedQuestions.length} questions selected.`)
  }

  if (loading) return (
    <div className="cb-loading">
      <div className="spinner" style={{width:40,height:40,borderWidth:3}} />
      <p>Loading course...</p>
    </div>
  )

  const cid = course?.id || id
  const completedLevels = activeLevel - 1

  return (
    <div className="cb-page">
      {notification && (
        <div className={`cb-notif ${notification.type === 'error' ? 'cb-notif-error' : 'cb-notif-success'}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.msg}
        </div>
      )}

      {/* Question Bank Modal */}
      {qbModal.open && (
        <QuestionBankModal
          language={qbModal.for === 'pre' ? preAssess.language : postAssess.language}
          selectedIds={(qbModal.for === 'pre' ? preAssess : postAssess).questions.map(q => q.id)}
          onSelect={handleQbSelect}
          onClose={() => setQbModal({ open: false, for: null })}
        />
      )}

      <div className="cb-inner">
        {/* Left Sidebar */}
        <aside className="cb-sidebar">
          <div className="cb-sidebar-title">HIERARCHY NAVIGATION</div>
          <nav className="cb-nav">
            {LEVELS.map(level => (
              <button
                key={level.id}
                className={`cb-nav-item ${activeLevel === level.id ? 'active' : ''} ${level.id < activeLevel ? 'completed' : ''}`}
                onClick={() => setActiveLevel(level.id)}
              >
                <span className="cb-nav-num">
                  {level.id < activeLevel ? '✓' : level.id}
                </span>
                <span className="cb-nav-label">
                  {level.id === 3 ? '3 & 4. Lessons & Content' : `${level.id}. ${level.label}`}
                </span>
              </button>
            ))}
          </nav>

          <div className="cb-status-box">
            <div className="cb-status-dot" />
            <div>
              <p className="cb-status-label">Course Status</p>
              <span className={`badge ${course?.status === 'active' ? 'badge-active' : course?.status === 'retired' ? 'badge-retired' : 'badge-draft'}`}>
                {course?.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Draft Mode'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="cb-main">
          {/* Course Header */}
          <div className="cb-course-header">
            <div className="cb-course-meta">
              <h1 className="cb-course-name">{meta.display_name || 'New Course'}</h1>
              <p className="cb-course-sub">
                {course?.course_id && <span>Course ID: {course.course_id} &nbsp;•&nbsp;</span>}
                {course ? `Last modified ${new Date(course.updated_at).toLocaleString('en-US', {hour:'numeric',minute:'2-digit',hour12:true})} ago` : 'New course'}
              </p>
            </div>
            <div className="cb-course-actions">
              {cid && (
                <button className="btn btn-secondary" onClick={handleClone}>
                  📋 Clone
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSaveLevel} disabled={saving}>
                {saving ? <><span className="spinner" style={{width:14,height:14}} /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Level Content */}
          <div className="cb-levels">

            {/* ===== LEVEL 1: Global Metadata ===== */}
            {activeLevel === 1 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">📊</span>
                    <h2>Level 1: Global Metadata</h2>
                  </div>
                  <div className="cb-level-actions">
                    <button className="btn btn-sm btn-danger" onClick={handleRetire}>Retire Course</button>
                    <button className="btn btn-sm btn-success" onClick={handleActivate}>Re-Activate</button>
                  </div>
                </div>

                <div className="cb-form-grid">
                  <div className="form-group cb-span-full">
                    <label className="form-label">Course Display Name</label>
                    <input className="form-input" value={meta.display_name} onChange={e => setMeta(p => ({...p, display_name: e.target.value}))} placeholder="e.g. Advanced Cybersecurity Compliance" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={meta.start_date} onChange={e => setMeta(p => ({...p, start_date: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={meta.end_date} onChange={e => setMeta(p => ({...p, end_date: e.target.value}))} />
                  </div>
                  <div className="form-group cb-span-full">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" rows={3} value={meta.description} onChange={e => setMeta(p => ({...p, description: e.target.value}))} placeholder="Describe the course objectives and learning outcomes..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taxonomy: Compliance</label>
                    <div className="cb-taxonomy-row">
                      <select className="form-select" value={meta.compliance_taxonomy} onChange={e => setMeta(p => ({...p, compliance_taxonomy: e.target.value}))}>
                        {COMPLIANCE_OPTIONS.map(o => <option key={o} value={o}>{o === 'none' ? 'None' : o}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-icon">+</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taxonomy: Skills</label>
                    <div className="cb-taxonomy-row">
                      <select className="form-select" value={meta.skills_taxonomy} onChange={e => setMeta(p => ({...p, skills_taxonomy: e.target.value}))}>
                        {SKILL_OPTIONS.map(o => <option key={o} value={o}>{o === 'none' ? 'None' : o}</option>)}
                      </select>
                      <button className="btn btn-secondary btn-icon">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== LEVEL 2: Pre-Assessment ===== */}
            {activeLevel === 2 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">📋</span>
                    <h2>Level 2: Baseline Pre-Assessment</h2>
                  </div>
                  <span className="badge badge-active">Active</span>
                </div>

                <div className="cb-assess-controls">
                  {/* Single Attempt */}
                  <div className="cb-assess-card card">
                    <label className="form-label">Single-Attempt</label>
                    <label className="toggle-wrapper" style={{marginTop: 12}}>
                      <label className="toggle">
                        <input type="checkbox" checked={preAssess.single_attempt} onChange={e => setPreAssess(p => ({...p, single_attempt: e.target.checked}))} />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{color: preAssess.single_attempt ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 600}}>
                        {preAssess.single_attempt ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  {/* Time Limit Slider */}
                  <div className="cb-assess-card card cb-assess-wide">
                    <label className="form-label">Time Limit (Minutes)</label>
                    <div className="cb-slider-wrapper">
                      <span className="cb-slider-min">15m</span>
                      <div className="cb-slider-track">
                        <input
                          type="range" min={15} max={180} step={5}
                          value={preAssess.time_limit_minutes}
                          onChange={e => setPreAssess(p => ({...p, time_limit_minutes: +e.target.value}))}
                          className="cb-slider"
                        />
                        <span className="cb-slider-current">Current: {preAssess.time_limit_minutes}m</span>
                      </div>
                      <span className="cb-slider-max">180m</span>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="cb-assess-card card">
                    <label className="form-label">Quiz Language</label>
                    <select className="form-select" style={{marginTop:8}} value={preAssess.language} onChange={e => setPreAssess(p => ({...p, language: e.target.value}))}>
                      {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Question Source Cards */}
                <div className="cb-q-source-grid">
                  {/* Browse Question Bank */}
                  <div className="card cb-q-source-card">
                    <div className="cb-q-source-icon">📚</div>
                    <h4>Browse Question Bank</h4>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Filter by Language</label>
                      <select className="form-select" value={preAssess.language} onChange={e => setPreAssess(p => ({...p, language: e.target.value}))}>
                        <option value="">All Languages</option>
                        {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-secondary" style={{width:'100%', marginTop:12, justifyContent:'center'}} onClick={() => setQbModal({open:true, for:'pre'})}>
                      Open Selector
                    </button>
                    {preAssess.questions.length > 0 && (
                      <p style={{fontSize:'0.78rem',color:'var(--accent-green)',marginTop:8,textAlign:'center'}}>✓ {preAssess.questions.length} questions selected</p>
                    )}
                  </div>

                  {/* Automated Randomization */}
                  <div className="card cb-q-source-card">
                    <div className="cb-q-source-icon">✨</div>
                    <h4>Automated Randomization</h4>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Question Count:</label>
                      <input className="form-input" type="number" min={1} max={100} value={preAssess.question_count} onChange={e => setPreAssess(p => ({...p, question_count: +e.target.value}))} style={{width:80}} />
                    </div>
                    <div className="toggle-wrapper" style={{marginTop:10}}>
                      <label className="toggle">
                        <input type="checkbox" checked={preAssess.randomize} onChange={e => setPreAssess(p => ({...p, randomize: e.target.checked}))} />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{fontSize:'0.82rem',color:'var(--text-secondary)'}}>Trainee Shuffle</span>
                    </div>
                  </div>

                  {/* Instant Creation */}
                  <div className="card cb-q-source-card cb-q-instant">
                    <div className="cb-q-instant-icon">+</div>
                    <h4>Instant Creation</h4>
                    <p>Direct question entry</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== LEVEL 3: Lessons & Content ===== */}
            {activeLevel === 3 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">📑</span>
                    <h2>Level 3 & 4: Course Content Flow</h2>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setNewLessonTitle(`Lesson ${lessons.length + 1}`)}>
                    + ADD NEW LESSON
                  </button>
                </div>

                {/* Add new lesson input */}
                {newLessonTitle !== '' && (
                  <div className="cb-new-lesson">
                    <input
                      className="form-input"
                      value={newLessonTitle}
                      onChange={e => setNewLessonTitle(e.target.value)}
                      placeholder="Lesson title..."
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAddLesson}>Add</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setNewLessonTitle('')}>Cancel</button>
                  </div>
                )}

                {/* Lessons List */}
                {lessons.length === 0 ? (
                  <div className="cb-empty-state">
                    <span>📑</span>
                    <p>No lessons yet. Click "ADD NEW LESSON" to get started.</p>
                  </div>
                ) : (
                  <div className="cb-lessons-list">
                    {lessons.map((lesson, idx) => (
                      <div key={lesson.id} className="cb-lesson card">
                        <div className="cb-lesson-header" onClick={() => setExpandedLessons(prev => ({...prev, [lesson.id]: !prev[lesson.id]}))}>
                          <div className="cb-lesson-left">
                            <span className="cb-lesson-drag">⋮⋮</span>
                            <span className="cb-lesson-num">{String(idx + 1).padStart(2, '0')}</span>
                            <h4 className="cb-lesson-title">{lesson.title}</h4>
                          </div>
                          <div className="cb-lesson-right">
                            <span className="cb-lesson-count">
                              {(lesson.files || []).length > 0 ? `${lesson.files.length} ${lesson.files.length === 1 ? 'File' : 'Files'} Uploaded` : 'No content yet'}
                            </span>
                            <span className={`cb-chevron ${expandedLessons[lesson.id] ? 'open' : ''}`}>▼</span>
                          </div>
                        </div>

                        {expandedLessons[lesson.id] && (
                          <div className="cb-lesson-content">
                            {(lesson.files || []).length > 0 && (
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>File Name</th>
                                    <th>Type</th>
                                    <th>Language</th>
                                    <th>Allow Offline Download</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lesson.files.map(file => (
                                    <tr key={file.id}>
                                      <td>
                                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                                          {file.file_type === 'video' ? '🎥' : '📄'}
                                          <span>{file.original_filename}</span>
                                        </div>
                                      </td>
                                      <td style={{color:'var(--text-secondary)',fontSize:'0.82rem',textTransform:'capitalize'}}>{file.file_type}</td>
                                      <td>
                                        <input
                                          type="checkbox"
                                          className="cb-checkbox"
                                          checked={file.language === 'en'}
                                          readOnly
                                          style={{accentColor:'var(--accent-blue)'}}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="checkbox"
                                          className="cb-checkbox"
                                          checked={file.allow_offline_download}
                                          onChange={() => handleToggleOffline(lesson.id, file.id, file.allow_offline_download)}
                                          style={{accentColor:'var(--accent-blue)'}}
                                        />
                                      </td>
                                      <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteLessonFile(lesson.id, file.id)}>🗑</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            <div className="cb-lesson-actions">
                              <input
                                ref={fileInputRef}
                                type="file"
                                style={{display:'none'}}
                                accept=".mp4,.mov,.pdf,.ppt,.pptx,.docx"
                                onChange={e => {
                                  if (e.target.files[0]) handleUploadLessonFile(lessonFileTarget, e.target.files[0])
                                  e.target.value = ''
                                }}
                              />
                              <button
                                className="btn btn-ghost cb-upload-asset-btn"
                                onClick={() => { setLessonFileTarget(lesson.id); setTimeout(() => fileInputRef.current?.click(), 50) }}
                              >
                                + Upload Multi-Format Assets
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{color:'var(--accent-red)'}} onClick={() => handleDeleteLesson(lesson.id)}>
                                Delete Lesson
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== LEVEL 4: Post-Assessment ===== */}
            {activeLevel === 4 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">✅</span>
                    <h2>Level 5: Post-Assessment (Competency Gate)</h2>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-muted)',fontSize:'0.8rem'}}>
                    🔒 Visibility locked until content completion
                  </div>
                </div>

                <div className="cb-post-controls">
                  {/* Passing Threshold */}
                  <div className="card cb-threshold-card">
                    <div className="cb-threshold-circle">
                      <svg viewBox="0 0 100 100" width="90" height="90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent-blue)" strokeWidth="8"
                          strokeDasharray={`${2.51 * postAssess.passing_threshold} ${251 - 2.51 * postAssess.passing_threshold}`}
                          strokeDashoffset="63" strokeLinecap="round"/>
                        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--accent-blue)">
                          {postAssess.passing_threshold}%
                        </text>
                      </svg>
                    </div>
                    <div>
                      <label className="form-label">Passing Threshold</label>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                        <input
                          className="form-input"
                          type="number"
                          min={1} max={100}
                          value={postAssess.passing_threshold}
                          onChange={e => setPostAssess(p => ({...p, passing_threshold: +e.target.value}))}
                          style={{width:80}}
                        />
                        <span style={{color:'var(--text-secondary)'}}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Max Attempts */}
                  <div className="card cb-assess-card">
                    <div className="cb-refresh-icon">🔄</div>
                    <label className="form-label">Max Attempts Allowed</label>
                    <select className="form-select" style={{marginTop:8}} value={postAssess.max_attempts} onChange={e => setPostAssess(p => ({...p, max_attempts: +e.target.value}))}>
                      <option value={1}>1 Attempt</option>
                      <option value={2}>2 Attempts</option>
                      <option value={3}>3 Attempts</option>
                      <option value={5}>5 Attempts</option>
                      <option value={0}>Unlimited</option>
                    </select>
                  </div>

                  {/* Quiz Language */}
                  <div className="card cb-assess-card">
                    <div className="cb-globe-icon">🌐</div>
                    <label className="form-label">Quiz Language</label>
                    <select className="form-select" style={{marginTop:8}} value={postAssess.language} onChange={e => setPostAssess(p => ({...p, language: e.target.value}))}>
                      {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Question Source Cards */}
                <div className="cb-q-source-grid">
                  <div className="card cb-q-source-card">
                    <div className="cb-q-source-icon">📚</div>
                    <h4>Browse Question Bank</h4>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Filter by Language</label>
                      <select className="form-select" value={postAssess.language} onChange={e => setPostAssess(p => ({...p, language: e.target.value}))}>
                        <option value="">All Languages</option>
                        {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-secondary" style={{width:'100%', marginTop:12, justifyContent:'center'}} onClick={() => setQbModal({open:true, for:'post'})}>
                      Open Selector
                    </button>
                    {postAssess.questions.length > 0 && (
                      <p style={{fontSize:'0.78rem',color:'var(--accent-green)',marginTop:8,textAlign:'center'}}>✓ {postAssess.questions.length} questions selected</p>
                    )}
                  </div>

                  <div className="card cb-q-source-card">
                    <div className="cb-q-source-icon">✨</div>
                    <h4>Randomized Generator</h4>
                    <div className="form-group" style={{marginTop:12}}>
                      <label className="form-label">Question Count</label>
                      <input className="form-input" type="number" min={1} value={postAssess.question_count} onChange={e => setPostAssess(p => ({...p, question_count: +e.target.value}))} style={{width:80}} />
                    </div>
                    <div className="toggle-wrapper" style={{marginTop:10}}>
                      <label className="toggle">
                        <input type="checkbox" checked={postAssess.randomize} onChange={e => setPostAssess(p => ({...p, randomize: e.target.checked}))} />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{fontSize:'0.82rem',color:'var(--text-secondary)'}}>Shuffle for each trainee</span>
                    </div>
                  </div>

                  <div className="card cb-q-source-card cb-q-instant">
                    <div className="cb-q-instant-icon">+</div>
                    <h4>Manual Entry</h4>
                    <p>Write questions directly</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== LEVEL 5: Certification ===== */}
            {activeLevel === 5 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">🎓</span>
                    <h2>Level 6: Certification Settings</h2>
                  </div>
                </div>

                <div className="cb-cert-layout">
                  {/* Template Selector */}
                  <div className="cb-cert-left">
                    <div className="card">
                      <label className="form-label">Design Template</label>
                      <div className="cb-cert-templates">
                        {[
                          { value: 'corporate_modern', label: 'Corporate - Modern' },
                          { value: 'minimalist_blue', label: 'Minimalist Blue' },
                          { value: 'academic_formal', label: 'Academic Formal' },
                        ].map(t => (
                          <button
                            key={t.value}
                            className={`cb-template-btn ${cert.template === t.value ? 'active' : ''}`}
                            onClick={async () => {
                              setCert(p => ({...p, template: t.value}))
                              // Auto-save template selection if course exists
                              if (cid && cert.id && isRealUser) {
                                try {
                                  await coursesAPI.updateCertification(cid, cert.id, { template: t.value })
                                  showNotif(`Template "${t.label}" selected and saved.`)
                                } catch { showNotif('Template selected (save manually to persist).') }
                              }
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="cb-cert-export">
                        <button
                          className="btn btn-secondary"
                          disabled={!cid || saving}
                          onClick={async () => {
                            if (!cid) { showNotif('Save the course first.', 'error'); return }
                            setSaving(true)
                            try {
                              // Save cert settings first, then trigger a preview download
                              if (cert.id) {
                                await coursesAPI.updateCertification(cid, cert.id, {
                                  template: cert.template,
                                  enable_soft_expiry: cert.enable_soft_expiry,
                                  enable_recertification_reminder: cert.enable_recertification_reminder,
                                })
                              }
                              // Download analytics/preview PDF via the analytics report endpoint
                              // as a proxy — or just show a success message since real cert
                              // generation requires a passed submission
                              showNotif('Template saved! PDF will be generated when a trainee passes the assessment.')
                            } catch { showNotif('Failed to save template.', 'error') }
                            finally { setSaving(false) }
                          }}
                        >
                          📥 PDF Export
                        </button>
                        <button
                          className="btn btn-secondary"
                          disabled={!cid || saving}
                          onClick={async () => {
                            if (!cid) { showNotif('Save the course first.', 'error'); return }
                            setSaving(true)
                            try {
                              if (cert.id) {
                                await coursesAPI.updateCertification(cid, cert.id, {
                                  template: cert.template,
                                  enable_soft_expiry: cert.enable_soft_expiry,
                                  enable_recertification_reminder: cert.enable_recertification_reminder,
                                })
                              }
                              showNotif('Template saved! PNG will be generated when a trainee passes the assessment.')
                            } catch { showNotif('Failed to save template.', 'error') }
                            finally { setSaving(false) }
                          }}
                        >
                          🖼️ High-Res PNG
                        </button>
                      </div>
                      {!cid && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--accent-yellow)', marginTop: 8 }}>
                          ⚠️ Save course metadata first to enable export.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Certificate Preview */}
                  <div className="cb-cert-preview">
                    <div className={`cb-cert-card cb-cert-${cert.template}`}>
                      <div className="cb-cert-shield">🛡️</div>
                      <h3>CERTIFICATE OF COMPLETION</h3>
                      <p className="cb-cert-certifies">This certifies that</p>
                      <h2 className="cb-cert-name">[TRAINEE NAME]</h2>
                      <p className="cb-cert-completed">Has successfully completed the advanced compliance training for</p>
                      <p className="cb-cert-course">{meta.display_name || 'Cybersecurity Governance (Level 4)'}</p>
                      <div className="cb-cert-footer">
                        <div>
                          <p className="cb-cert-footer-label">ISSUE DATE</p>
                          <p className="cb-cert-footer-val">{new Date().toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="cb-cert-footer-label">CERTIFICATE ID</p>
                          <p className="cb-cert-footer-val">#LMS-{Math.floor(Math.random() * 10000).toString().padStart(6,'0')}-X</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== LEVEL 6: Timeline & Expiry ===== */}
            {activeLevel === 6 && (
              <div className="cb-level-panel">
                <div className="cb-level-header">
                  <div className="cb-level-title">
                    <span className="cb-level-icon">⏱️</span>
                    <h2>Timeline & Expiry Management</h2>
                  </div>
                </div>

                <div className="cb-timeline-layout">
                  {/* Batch Expiry */}
                  <div className="card cb-timeline-card">
                    <h4 className="cb-timeline-subtitle">Batch Expiry Management</h4>
                    <div className="form-group" style={{marginTop:16}}>
                      <div className="cb-batch-row">
                        <span className="cb-batch-icon">👥</span>
                        <div>
                          <label className="form-label">Target Group</label>
                          <select className="form-select" style={{marginTop:6}} value={batchExpiry.target_group} onChange={e => setBatchExpiry(p => ({...p, target_group: e.target.value}))}>
                            <option value="">Select Group</option>
                            <option value="IT Department (Q3 cohort)">IT Department (Q3 cohort)</option>
                            <option value="Engineering Team">Engineering Team</option>
                            <option value="All Employees">All Employees</option>
                            <option value="Security Team">Security Team</option>
                          </select>
                        </div>
                      </div>
                      <div className="cb-batch-row" style={{marginTop:12}}>
                        <span className="cb-batch-icon">📅</span>
                        <div style={{flex:1}}>
                          <label className="form-label">New Expiry Date</label>
                          <div style={{display:'flex',gap:8,marginTop:6}}>
                            <input className="form-input" type="date" value={batchExpiry.expiry_date} onChange={e => setBatchExpiry(p => ({...p, expiry_date: e.target.value}))} />
                            <button className="btn btn-primary" onClick={handleSaveLevel} disabled={saving}>Apply Update</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Overrides */}
                  <div className="card cb-timeline-card">
                    <h4 className="cb-timeline-subtitle">Policy Overrides</h4>
                    <div className="cb-policy-items">
                      <label className="cb-policy-item">
                        <input
                          type="checkbox"
                          style={{accentColor:'var(--accent-blue)', width:16, height:16}}
                          checked={cert.enable_soft_expiry}
                          onChange={e => setCert(p => ({...p, enable_soft_expiry: e.target.checked}))}
                        />
                        <div>
                          <p className="cb-policy-title">Enable Soft Expiry</p>
                          <p className="cb-policy-desc">Allow 7-day grace period for trainees to download certificates after course deactivation.</p>
                        </div>
                      </label>
                      <label className="cb-policy-item">
                        <input
                          type="checkbox"
                          style={{accentColor:'var(--accent-blue)', width:16, height:16}}
                          checked={cert.enable_recertification_reminder}
                          onChange={e => setCert(p => ({...p, enable_recertification_reminder: e.target.checked}))}
                        />
                        <div>
                          <p className="cb-policy-title">Automated Re-certification Reminders</p>
                          <p className="cb-policy-desc">Notify users 30 days before certification expiry via email and platform alerts.</p>
                        </div>
                      </label>
                    </div>
                    <button className="btn btn-primary" style={{marginTop:16}} onClick={handleSaveLevel} disabled={saving}>
                      Save Policy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="cb-bottom-bar">
        <div className="cb-progress-dots">
          {LEVELS.map(level => (
            <div
              key={level.id}
              className={`cb-progress-dot ${activeLevel >= level.id ? 'active' : ''}`}
              onClick={() => setActiveLevel(level.id)}
              title={level.label}
            />
          ))}
          <span className="cb-progress-label">LEVEL {activeLevel} OF {LEVELS.length} COMPLETE</span>
        </div>
        <div className="cb-bottom-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/courses')}>Discard Draft</button>
          <button className="btn btn-primary" onClick={activeLevel < LEVELS.length ? () => setActiveLevel(prev => Math.min(LEVELS.length, prev + 1)) : handleFinish} disabled={saving}>
            {activeLevel < LEVELS.length ? 'Next Level →' : 'Finish Builder'}
          </button>
        </div>
      </div>
    </div>
  )
}
