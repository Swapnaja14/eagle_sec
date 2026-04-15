import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainingCalendarPage.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

// Seed mock sessions across the current month
const TODAY = new Date();
const generateSessions = () => {
  const sessions = [];
  const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const daysInMonth = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate();
  const topics = ['PSARA Foundation', 'Fire Safety & Evacuation', 'Emergency Response', 'CCTV Operations', 'First Aid', 'Access Control'];
  const trainers = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Rao'];

  for (let i = 0; i < 18; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
    const type = Math.random() > 0.5 ? 'classroom' : 'virtual';
    sessions.push({
      id: `S-${i}`,
      topic: topics[i % topics.length],
      type,
      trainer: trainers[i % trainers.length],
      date: new Date(TODAY.getFullYear(), TODAY.getMonth(), day),
      hour,
      duration: Math.random() > 0.5 ? 2 : 1,
    });
  }
  return sessions;
};

const ALL_SESSIONS = generateSessions();

export default function TrainingCalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  const navigate_prev = () => {
    if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    else setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd; });
  };
  const navigate_next = () => {
    if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    else setCurrentDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 7); return nd; });
  };

  // Build month grid cells
  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    // Previous month filler
    const prevDaysInMonth = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevDaysInMonth - i, currentMonth: false, date: new Date(year, month - 1, prevDaysInMonth - i) });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, currentMonth: true, date: new Date(year, month, d) });
    }
    // Next month filler
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, currentMonth: false, date: new Date(year, month + 1, d) });
    }
    return cells;
  }, [currentDate]);

  // Build week days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    // For week view, find the Monday of the current week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getSessionsForDate = (date) =>
    ALL_SESSIONS.filter(s => s.date.toDateString() === date.toDateString());

  const isToday = (date) => date.toDateString() === TODAY.toDateString();

  const totalSessions = ALL_SESSIONS.length;
  const classroomCount = ALL_SESSIONS.filter(s => s.type === 'classroom').length;
  const virtualCount = ALL_SESSIONS.filter(s => s.type === 'virtual').length;

  return (
    <div className="calendar-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Training Schedule Calendar</h1>
          <p className="page-subtitle">View and manage all training sessions across the organization.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sessions/classroom/new')}>
          + Schedule Session
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'This Month', value: totalSessions, color: 'var(--accent-blue)' },
          { label: 'Classroom', value: classroomCount, color: 'var(--accent-cyan)' },
          { label: 'Virtual', value: virtualCount, color: 'var(--accent-purple)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', minWidth: 140 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={navigate_prev}>‹</button>
          <span className="calendar-month-label">
            {MONTHS[view === 'month' ? currentDate.getMonth() : weekDays[0].getMonth()]} {view === 'month' ? currentDate.getFullYear() : weekDays[0].getFullYear()}
          </span>
          <button className="calendar-nav-btn" onClick={navigate_next}>›</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))}>Today</button>
        </div>

        <div className="calendar-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }}></div> Classroom</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#a855f7' }}></div> Virtual</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#22c55e' }}></div> Completed</div>
        </div>

        <div className="view-toggle">
          <button className={`view-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
          <button className={`view-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
        </div>
      </div>

      {/* === MONTH VIEW === */}
      {view === 'month' && (
        <div className="calendar-grid">
          <div className="calendar-header-row">
            {DAYS.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
          </div>
          <div className="calendar-body">
            {monthCells.map((cell, idx) => {
              const sessions = getSessionsForDate(cell.date);
              const showSessions = sessions.slice(0, 2);
              const extraCount = sessions.length - showSessions.length;
              return (
                <div key={idx} className={`calendar-cell ${!cell.currentMonth ? 'other-month' : ''} ${isToday(cell.date) ? 'today' : ''}`}>
                  <div className="cell-date">{cell.day}</div>
                  {showSessions.map(s => (
                    <div key={s.id} className={`cell-event ${s.type}`} title={s.topic}>
                      {s.type === 'virtual' ? '💻' : '🏫'} {s.topic}
                    </div>
                  ))}
                  {extraCount > 0 && <div className="cell-more">+{extraCount} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === WEEK VIEW === */}
      {view === 'week' && (
        <div className="week-view">
          <div className="week-header">
            <div className="week-time-gutter" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GMT+5:30</div>
            {weekDays.map((day, i) => (
              <div key={i} className={`week-day-col ${isToday(day) ? 'today' : ''}`}>
                <div className="week-day-name">{DAYS[(i + 1) % 7]}</div>
                <div className="week-day-num">{day.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="week-body custom-scrollbar">
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                <div className="time-slot">{hour}:00</div>
                {weekDays.map((day, dayIdx) => {
                  const session = ALL_SESSIONS.find(s => s.date.toDateString() === day.toDateString() && s.hour === hour);
                  return (
                    <div key={dayIdx} className="day-slot">
                      {session && (
                        <div className={`week-event ${session.type}`} title={`${session.topic} — ${session.trainer}`}>
                          {session.topic}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
