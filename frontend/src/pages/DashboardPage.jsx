import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { contentAPI, coursesAPI } from '../services/api'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ content: 0, courses: 0, active: 0, archived: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contentRes, coursesRes, archivedRes] = await Promise.all([
          contentAPI.list({ page_size: 1 }),
          coursesAPI.list({ page_size: 1 }),
          contentAPI.list({ show_archived: 'true', status: 'archived', page_size: 1 }),
        ])
        setStats({
          content: contentRes.data.count || 0,
          courses: coursesRes.data.count || 0,
          active: (contentRes.data.count || 0),
          archived: archivedRes.data.count || 0,
        })
      } catch { /* ignore */ }
    }
    fetchStats()
  }, [])

  const quickActions = [
    { title: 'Upload Content', desc: 'Add videos, docs & presentations', icon: '📤', to: '/content/upload', color: '#3b82f6' },
    { title: 'Create Course', desc: 'Build a new training course', icon: '🎓', to: '/courses/new', color: '#06b6d4' },
    { title: 'Browse Courses', desc: 'View and manage all courses', icon: '📚', to: '/courses', color: '#a855f7' },
  ]

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-inner">
          <div className="dashboard-welcome">
            <h1>Welcome back, {user?.first_name || user?.username}! 👋</h1>
            <p>Here's what's happening in your learning ecosystem today.</p>
          </div>
          <div className="dashboard-badges">
            <span className="badge badge-active" style={{padding:'6px 14px', fontSize:'0.8rem'}}>
              ● {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
            {user?.tenant && <span className="badge badge-draft" style={{padding:'6px 14px', fontSize:'0.8rem'}}>{user.tenant.name}</span>}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Content Files', value: stats.content, icon: '🗂️', color: '#3b82f6', sub: 'All uploaded files' },
            { label: 'Total Courses', value: stats.courses, icon: '📘', color: '#06b6d4', sub: 'Active & draft' },
            { label: 'Active Content', value: stats.active, icon: '✅', color: '#22c55e', sub: 'Published files' },
            { label: 'Archived Files', value: stats.archived, icon: '📦', color: '#f59e0b', sub: 'Archived content' },
          ].map((stat, i) => (
            <div key={i} className="stat-card card">
              <div className="stat-card-top">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-sub">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, i) => (
              <button key={i} className="quick-action-card card" onClick={() => navigate(action.to)}>
                <div className="quick-action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="quick-action-title">{action.title}</h3>
                  <p className="quick-action-desc">{action.desc}</p>
                </div>
                <svg className="quick-action-arrow" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section className="dashboard-section">
          <h2 className="section-title">Getting Started with LearnSphere</h2>
          <div className="steps-grid">
            {[
              { step: '01', title: 'Upload Training Content', desc: 'Upload videos, PDFs, and presentations to the Content Hub with metadata, tagging, and taxonomy.' },
              { step: '02', title: 'Build a Course', desc: 'Use the Course Builder to organize content into structured lessons with pre/post assessments.' },
              { step: '03', title: 'Set Certifications', desc: 'Configure completion certificates with custom templates, expiry dates, and re-certification reminders.' },
            ].map((step, i) => (
              <div key={i} className="step-card card">
                <div className="step-num">{step.step}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
