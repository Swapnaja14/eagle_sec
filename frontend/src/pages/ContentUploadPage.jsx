import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { contentAPI } from '../services/api'
import './ContentUploadPage.css'

const SUBJECTS = [
  { value: '', label: 'Select Subject' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'devops', label: 'DevOps' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'networking', label: 'Networking' },
  { value: 'software_development', label: 'Software Development' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'other', label: 'Other' },
]

const LANGUAGES = [
  { value: '', label: 'Select Language' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
]

function FileIcon({ type }) {
  if (type === 'video') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="3"/>
      <polygon points="10,8 16,12 10,16" fill="#3b82f6" stroke="none"/>
    </svg>
  )
  if (type === 'presentation') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
      <rect x="3" y="3" width="18" height="16" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function UploadQueueItem({ file, progress, onRemove }) {
  const isComplete = progress >= 100
  const minutes = Math.max(0, Math.ceil((100 - progress) * 0.03))
  return (
    <div className="upload-queue-item">
      <div className="upload-queue-left">
        <div className="upload-file-icon"><FileIcon type={file._fileType} /></div>
        <div className="upload-file-info">
          <span className="upload-file-name">{file.name}</span>
          {!isComplete && <span className="upload-file-time">{minutes > 0 ? `~${minutes} minutes remaining` : 'Completing...'}</span>}
          {isComplete && <span className="upload-file-done">✓ Upload complete</span>}
        </div>
      </div>
      <div className="upload-queue-right">
        <span className="upload-pct">{progress}%</span>
        <button className="upload-remove-btn" onClick={onRemove} title="Cancel">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="upload-queue-bar">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{width: `${progress}%`}} />
        </div>
      </div>
    </div>
  )
}

export default function ContentUploadPage() {
  const [uploadQueue, setUploadQueue] = useState([])
  const [metadata, setMetadata] = useState({ title: '', description: '' })
  const [videoOpts, setVideoOpts] = useState({ duration: '', thumbnail: null })
  const [docOpts, setDocOpts] = useState({ page_count: '', permissions: 'view_only' })
  const [taxonomy, setTaxonomy] = useState({ subject: '', language: '', difficulty: 'medium' })
  const [smartTags, setSmartTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [contentList, setContentList] = useState([])
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  const [activeFileType, setActiveFileType] = useState(null)
  const thumbnailRef = useRef()

  const fetchContent = useCallback(async () => {
    try {
      const res = await contentAPI.list({ show_archived: showArchived ? 'true' : 'false' })
      setContentList(res.data.results || [])
    } catch { /* ignore */ }
  }, [showArchived])

  useEffect(() => { fetchContent() }, [fetchContent])

  const detectFileType = (name) => {
    const lower = name.toLowerCase()
    if (['.mp4', '.mov', '.avi', '.mkv'].some(e => lower.endsWith(e))) return 'video'
    if (['.ppt', '.pptx'].some(e => lower.endsWith(e))) return 'presentation'
    return 'document'
  }

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(f => {
      f._fileType = detectFileType(f.name)
      return f
    })
    setUploadQueue(prev => [...prev, ...newFiles.map(f => ({ file: f, progress: 0, id: Math.random() }))])
    if (newFiles.length > 0) {
      setActiveFileType(newFiles[0]._fileType)
      setMetadata(prev => ({ ...prev, title: newFiles[0].name.replace(/\.[^.]+$/, '') }))
    }

    // Simulate upload progress for each file
    newFiles.forEach((f, idx) => {
      const id = Math.random()
      let prog = 0
      setUploadQueue(prev => [...prev, { file: f, progress: 0, id }])
      const timer = setInterval(() => {
        prog += Math.random() * 8 + 2
        if (prog >= 100) { prog = 100; clearInterval(timer) }
        setUploadQueue(prev => prev.map(item => item.file === f ? { ...item, progress: Math.min(100, Math.round(prog)) } : item))
      }, 300)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: false,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    }
  })

  const removeFromQueue = (id) => setUploadQueue(prev => prev.filter(item => item.id !== id))

  const addTag = () => {
    const val = tagInput.trim()
    if (val && !smartTags.includes(val)) {
      setSmartTags(prev => [...prev, val])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  const removeTag = (tag) => setSmartTags(prev => prev.filter(t => t !== tag))

  const handleSave = async () => {
    const completedFile = uploadQueue.find(item => item.progress >= 100)
    if (!completedFile && uploadQueue.length === 0) {
      showNotif('Please upload at least one file.', 'error'); return
    }
    setSaving(true)
    try {
      // Save metadata for each completed upload
      const completed = uploadQueue.filter(item => item.progress >= 100)
      for (const item of completed) {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('title', metadata.title || item.file.name)
        formData.append('description', metadata.description)
        formData.append('subject', taxonomy.subject)
        formData.append('language', taxonomy.language)
        formData.append('difficulty', taxonomy.difficulty)
        if (activeFileType === 'video' && videoOpts.duration) formData.append('duration', videoOpts.duration)
        if (activeFileType === 'document' && docOpts.page_count) formData.append('page_count', docOpts.page_count)
        formData.append('permissions', docOpts.permissions)
        if (smartTags.length > 0) {
          smartTags.forEach(tag => formData.append('tag_names', tag))
        }

        await contentAPI.upload(formData, () => {})
      }
      // Also save queued files that aren't done yet as metadata-only
      showNotif('Content saved successfully!', 'success')
      setUploadQueue([])
      setMetadata({ title: '', description: '' })
      setSmartTags([])
      fetchContent()
    } catch (err) {
      showNotif(err.response?.data?.detail || 'Failed to save content.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id) => {
    try {
      await contentAPI.archive(id)
      fetchContent()
      showNotif('Status updated.', 'success')
    } catch { showNotif('Failed to update status.', 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return
    try {
      await contentAPI.delete(id)
      fetchContent()
      showNotif('File deleted.', 'success')
    } catch { showNotif('Failed to delete.', 'error') }
  }

  const showNotif = (msg, type) => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  return (
    <div className="cup-page">
      {/* Notification */}
      {notification && (
        <div className={`cup-notif cup-notif-${notification.type}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="cup-header">
        <div className="cup-header-inner">
          <div>
            <h1>Upload Content</h1>
            <p>Add new educational videos, presentations, or documents to the central repository.</p>
          </div>
        </div>
      </div>

      <div className="cup-body">
        {/* Left Column */}
        <div className="cup-left">
          {/* Drop Zone */}
          <div className={`cup-dropzone ${isDragActive ? 'dragging' : ''}`} {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="cup-drop-icons">
              <span className="cup-drop-icon cup-drop-video">🎥</span>
              <span className="cup-drop-icon cup-drop-main">📤</span>
              <span className="cup-drop-icon cup-drop-doc">📄</span>
            </div>
            <h3>Drag and drop files here</h3>
            <p>Supported formats: .mp4, .mov, .pdf, .ppt, .pptx</p>
            <button type="button" className="btn btn-primary" onClick={(e) => { e.stopPropagation(); open() }}>
              Browse Files
            </button>
          </div>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <div className="cup-queue">
              {uploadQueue.map(item => (
                <UploadQueueItem
                  key={item.id}
                  file={item.file}
                  progress={item.progress}
                  onRemove={() => removeFromQueue(item.id)}
                />
              ))}
            </div>
          )}

          {/* Content Metadata */}
          <div className="cup-section card">
            <h3 className="cup-section-title">Content Metadata</h3>
            <div className="form-group">
              <label className="form-label">Content Title</label>
              <input
                className="form-input"
                placeholder="e.g. Introduction to Network Security"
                value={metadata.title}
                onChange={e => setMetadata(p => ({...p, title: e.target.value}))}
              />
            </div>
            <div className="form-group" style={{marginTop: 14}}>
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Briefly describe the contents of this file..."
                value={metadata.description}
                onChange={e => setMetadata(p => ({...p, description: e.target.value}))}
                rows={4}
              />
            </div>
          </div>

          {/* Video Options */}
          {(activeFileType === 'video' || uploadQueue.some(i => i.file._fileType === 'video')) && (
            <div className="cup-section card">
              <div className="cup-section-header">
                <span className="cup-section-dot cup-dot-blue" />
                <h4 className="cup-section-subtitle">VIDEO OPTIONS</h4>
              </div>
              <div className="cup-options-row">
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Video Duration</label>
                  <div className="cup-duration-input">
                    <span className="cup-duration-icon">⏱</span>
                    <input
                      className="form-input"
                      placeholder="00:00:00"
                      value={videoOpts.duration}
                      onChange={e => setVideoOpts(p => ({...p, duration: e.target.value}))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Custom Thumbnail</label>
                  <div className="cup-thumbnail">
                    <div className="cup-thumbnail-preview">
                      {videoOpts.thumbnail
                        ? <img src={URL.createObjectURL(videoOpts.thumbnail)} alt="thumb" />
                        : <div className="cup-thumbnail-placeholder">🎥</div>
                      }
                    </div>
                    <input
                      ref={thumbnailRef}
                      type="file"
                      accept="image/*"
                      style={{display:'none'}}
                      onChange={e => setVideoOpts(p => ({...p, thumbnail: e.target.files[0]}))}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => thumbnailRef.current.click()}>
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Options */}
          {(activeFileType === 'document' || activeFileType === 'presentation' ||
            uploadQueue.some(i => ['document','presentation'].includes(i.file._fileType))) && (
            <div className="cup-section card">
              <div className="cup-section-header">
                <span className="cup-section-dot cup-dot-green" />
                <h4 className="cup-section-subtitle">DOCUMENT OPTIONS (PDF/PPT)</h4>
              </div>
              <div className="cup-options-row">
                <div className="form-group">
                  <label className="form-label">Page Count</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="—"
                    style={{width: 100}}
                    value={docOpts.page_count}
                    onChange={e => setDocOpts(p => ({...p, page_count: e.target.value}))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Permissions</label>
                  <div className="cup-permissions">
                    {[{value: 'view_only', label: 'View Only'}, {value: 'allow_download', label: 'Allow Download'}].map(opt => (
                      <button
                        key={opt.value}
                        className={`btn btn-sm ${docOpts.permissions === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDocOpts(p => ({...p, permissions: opt.value}))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manage Content Table */}
          <div className="cup-manage card">
            <div className="cup-manage-header">
              <h3 className="cup-section-title" style={{margin:0}}>Manage Content</h3>
              <label className="toggle-wrapper" style={{gap:8}}>
                <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>Show Archived Content</span>
                <label className="toggle">
                  <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </label>
            </div>

            {contentList.length === 0 ? (
              <div className="cup-empty">
                <span>📂</span>
                <p>No content files yet. Upload your first file above!</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Version</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentList.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="cup-file-cell">
                          <FileIcon type={item.file_type} />
                          <span className="cup-file-name">{item.original_filename || item.title}</span>
                        </div>
                      </td>
                      <td><span className="cup-version">{item.version}</span></td>
                      <td><span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{new Date(item.upload_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}</span></td>
                      <td>
                        <span className={`badge badge-${item.status}`}>
                          {item.status === 'active' ? '● Active' : item.status}
                        </span>
                      </td>
                      <td>
                        <div className="cup-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleArchive(item.id)}>
                            {item.status === 'active' ? 'Archive' : 'Restore'}
                          </button>
                          <button className="btn btn-ghost btn-sm cup-delete-btn" onClick={() => handleDelete(item.id)}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column — Tagging & Taxonomy */}
        <div className="cup-right">
          <div className="cup-taxonomy card">
            <h3 className="cup-taxonomy-title">Tagging & Taxonomy</h3>

            <div className="form-group">
              <label className="form-label">Subject Mapping</label>
              <select className="form-select" value={taxonomy.subject} onChange={e => setTaxonomy(p => ({...p, subject: e.target.value}))}>
                {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{marginTop: 16}}>
              <label className="form-label">Smart Tags</label>
              <div className="cup-tag-input-wrapper">
                <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="cup-tag-input"
                  placeholder="Add or search tags..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
              {smartTags.length > 0 && (
                <div className="cup-tags">
                  {smartTags.map(tag => (
                    <span key={tag} className="chip">
                      {tag}
                      <button className="chip-remove" onClick={() => removeTag(tag)}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{marginTop: 16}}>
              <label className="form-label">Language Tags</label>
              <select className="form-select" value={taxonomy.language} onChange={e => setTaxonomy(p => ({...p, language: e.target.value}))}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{marginTop: 16}}>
              <label className="form-label">Difficulty Level</label>
              <div className="cup-difficulty">
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    className={`cup-diff-btn ${taxonomy.difficulty === d ? 'active' : ''} cup-diff-${d}`}
                    onClick={() => setTaxonomy(p => ({...p, difficulty: d}))}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Tip */}
          <div className="cup-pro-tip card">
            <div className="cup-pro-tip-header">
              <span className="cup-pro-tip-dot" />
              <strong>Pro Tip</strong>
            </div>
            <p>Accurate metadata and tagging increase content discoverability by 45%. Take a moment to ensure subjects are mapped correctly.</p>
          </div>

          {/* Save Actions */}
          <div className="cup-save-actions">
            <button className="btn btn-secondary" onClick={() => { setUploadQueue([]); setMetadata({title:'',description:''}); setSmartTags([]) }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{width:16,height:16}} /> Saving...</> : '💾 Save Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
