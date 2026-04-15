import React, { useState, useEffect, useCallback } from 'react';
import { questionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { value: 'all', label: 'All Languages', flag: '🌐' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'hi', label: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { value: 'mr', label: 'Marathi (मराठी)', flag: '🇮🇳' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
];

const DIFFICULTY_COLORS = { easy: 'badge-active', medium: 'badge-draft', hard: 'badge-retired' };
const TYPE_LABELS = { mcq: 'MCQ', true_false: 'True/False', short_answer: 'Short Answer' };

const BLANK_FORM = {
  text: '', question_type: 'mcq', language: 'en',
  difficulty: 'medium', subject: 'other',
  options: ['', '', '', ''], correct_answer: '0',
  explanation: '', points: 1,
};

export default function QuestionBankPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ language: 'all', difficulty: 'all', question_type: 'all', search: '' });
  const [previewQ, setPreviewQ] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isMockUser = user?._isMock;

  // ─── FETCH ─────────────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    if (isMockUser) {
      // Show mock data for demo users
      setQuestions([
        { id: 'Q-001', text: 'What does PSARA stand for?', language: 'en', question_type: 'mcq', difficulty: 'easy', subject: 'compliance', options: ['Private Security Agencies Regulation Act', 'Public Safety And Relief Act', 'Personnel Security Assistance Regulation Act', 'None of the above'], correct_answer: '0', points: 1 },
        { id: 'Q-002', text: 'The maximum penalty for operating without a PSARA license is?', language: 'en', question_type: 'mcq', difficulty: 'medium', subject: 'compliance', options: ['₹25,000 only', '1 year only', '₹25,000 or 1 year or both', '₹1,00,000'], correct_answer: '2', points: 2 },
        { id: 'Q-003', text: 'In a fire emergency, the first action is to raise the alarm.', language: 'en', question_type: 'true_false', difficulty: 'easy', subject: 'other', options: ['True', 'False'], correct_answer: '0', points: 1 },
        { id: 'Q-004', text: 'PSARA अधिनियम किस वर्ष लागू किया गया था?', language: 'hi', question_type: 'mcq', difficulty: 'medium', subject: 'compliance', options: ['2001', '2005', '2010', '2015'], correct_answer: '1', points: 2 },
        { id: 'Q-005', text: 'आपत्कालीन परिस्थितीत प्रथम क्रिया कोणती आहे?', language: 'mr', question_type: 'mcq', difficulty: 'easy', subject: 'other', options: ['पळणे', 'अलार्म वाजवणे', 'फोन करणे', 'वाट पाहणे'], correct_answer: '1', points: 1 },
      ]);
      setTotal(5);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (filters.language !== 'all') params.language = filters.language;
      if (filters.difficulty !== 'all') params.difficulty = filters.difficulty;
      if (filters.question_type !== 'all') params.question_type = filters.question_type;
      if (filters.search) params.search = filters.search;
      const { data } = await questionsAPI.list(params);
      const results = data.results ?? data;
      setQuestions(results);
      setTotal(data.count ?? results.length);
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [filters, isMockUser]);

  useEffect(() => {
    const t = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(t);
  }, [fetchQuestions]);

  // ─── CREATE / EDIT ──────────────────────────────────────────────────────────
  const openCreate = () => { setForm(BLANK_FORM); setEditingId(null); setFormError(''); setShowForm(true); };
  const openEdit = (q) => {
    setForm({
      text: q.text, question_type: q.question_type, language: q.language,
      difficulty: q.difficulty, subject: q.subject || 'other',
      options: Array.isArray(q.options) ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      correct_answer: String(q.correct_answer), explanation: q.explanation || '', points: q.points || 1,
    });
    setEditingId(q.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.text.trim()) { setFormError('Question text is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (isMockUser) {
        // Mock save
        if (editingId) {
          setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...form } : q));
        } else {
          setQuestions(prev => [{ id: `Q-${Date.now()}`, ...form }, ...prev]);
        }
        setShowForm(false);
        setSaving(false);
        return;
      }
      const payload = { ...form, options: form.options.filter(o => o.trim()) };
      if (editingId) {
        const { data } = await questionsAPI.update(editingId, payload);
        setQuestions(prev => prev.map(q => q.id === editingId ? data : q));
      } else {
        const { data } = await questionsAPI.create(payload);
        setQuestions(prev => [data, ...prev]);
        setTotal(t => t + 1);
      }
      setShowForm(false);
    } catch (err) {
      const d = err.response?.data;
      setFormError(d ? Object.values(d).flat().join(' ') : 'Failed to save question.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      if (!isMockUser) await questionsAPI.delete(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setTotal(t => t - 1);
    } catch { alert('Delete failed.'); }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.length} question(s)?`)) return;
    for (const id of selected) {
      try {
        if (!isMockUser) await questionsAPI.delete(id);
      } catch { /* skip */ }
    }
    setQuestions(prev => prev.filter(q => !selected.includes(q.id)));
    setSelected([]);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === questions.length ? [] : questions.map(q => q.id));

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {isMockUser ? '⚠️ Demo mode — changes won\'t persist. Log in with a real account to save.' : `${total} questions in your bank.`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => alert('CSV Import coming soon')}>📥 Bulk CSV Import</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Create Question</button>
        </div>
      </div>

      {/* Language Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {LANGUAGES.map(lang => (
          <button key={lang.value}
            className={`btn btn-sm ${filters.language === lang.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilters(f => ({ ...f, language: lang.value }))}>
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Difficulty</label>
            <select className="form-select" value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={filters.question_type} onChange={e => setFilters(f => ({ ...f, question_type: e.target.value }))}>
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
            <label className="form-label">Search</label>
            <input className="form-input" value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search question text..." />
          </div>
        </div>
      </div>

      {/* Bulk Bar */}
      {selected.length > 0 && (
        <div className="card" style={{ padding: '12px 20px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.3)' }}>
          <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{selected.length} selected</span>
          <button className="btn btn-secondary btn-sm">📤 Export</button>
          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={handleDeleteSelected}>🗑️ Delete</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Showing {questions.length}{total > questions.length ? ` of ${total}` : ''} questions</span>
          {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selected.length === questions.length && questions.length > 0} onChange={toggleAll} style={{ accentColor: 'var(--accent-blue)' }} /></th>
                <th>Question</th>
                <th>Lang</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.includes(q.id)} onChange={() => toggleSelect(q.id)} style={{ accentColor: 'var(--accent-blue)' }} /></td>
                  <td style={{ maxWidth: 340 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{q.subject}</div>
                  </td>
                  <td><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{q.language?.toUpperCase()}</span></td>
                  <td><span className="badge badge-archived">{TYPE_LABELS[q.question_type] || q.question_type}</span></td>
                  <td><span className={`badge ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{q.points}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPreviewQ(q)}>👁️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(q)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(q.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && questions.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  No questions found. <button className="btn btn-ghost btn-sm" onClick={openCreate}>Create one →</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewQ && (
        <div className="modal-overlay" onClick={() => setPreviewQ(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Question Preview</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewQ(null)}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge ${DIFFICULTY_COLORS[previewQ.difficulty]}`}>{previewQ.difficulty}</span>
                <span className="badge badge-archived">{TYPE_LABELS[previewQ.question_type]}</span>
                <span className="badge badge-processing">{previewQ.language?.toUpperCase()}</span>
              </div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 20 }}>{previewQ.text}</p>
              {Array.isArray(previewQ.options) && previewQ.options.map((opt, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 8, marginBottom: 8,
                  border: `1px solid ${String(i) === String(previewQ.correct_answer) ? 'rgba(34,197,94,0.4)' : 'var(--border-color)'}`,
                  background: String(i) === String(previewQ.correct_answer) ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                  color: String(i) === String(previewQ.correct_answer) ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontWeight: String(i) === String(previewQ.correct_answer) ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: String(i) === String(previewQ.correct_answer) ? 'rgba(34,197,94,0.2)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt} {String(i) === String(previewQ.correct_answer) && ' ✓'}
                </div>
              ))}
              {previewQ.explanation && <div style={{ marginTop: 16, padding: 12, background: 'rgba(59,130,246,0.06)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Explanation:</strong> {previewQ.explanation}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{editingId ? 'Edit Question' : 'Create Question'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--accent-red)', fontSize: '0.85rem' }}>{formError}</div>}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Question Text *</label>
                <textarea className="form-input" rows={3} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Enter your question..." style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))}>
                    <option value="mcq">MCQ</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Language</label>
                  <select className="form-select" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="en">English</option><option value="hi">Hindi</option>
                    <option value="mr">Marathi</option><option value="gu">Gujarati</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {form.question_type === 'mcq' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Answer Options — click ✓ to mark correct</label>
                  {form.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <button onClick={() => setForm(f => ({ ...f, correct_answer: String(i) }))}
                        style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${String(i) === form.correct_answer ? 'var(--accent-green)' : 'var(--border-color)'}`, background: String(i) === form.correct_answer ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)', color: String(i) === form.correct_answer ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input className="form-input" value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                    </div>
                  ))}
                </div>
              )}

              {form.question_type === 'true_false' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Correct Answer</label>
                  <select className="form-select" value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}>
                    <option value="0">True</option><option value="1">False</option>
                  </select>
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Explanation (optional)</label>
                <textarea className="form-input" rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Explain why the answer is correct..." style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : editingId ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
