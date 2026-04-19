import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { trainersAPI } from '../services/api';
import './DiscussionForumPage.css';

export default function DiscussionForumPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchMessages(activeThread.id);
      // Simple polling
      const interval = setInterval(() => fetchMessages(activeThread.id), 5000);
      return () => clearInterval(interval);
    }
  }, [activeThread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThreads = async () => {
    try {
      const res = await trainersAPI.listThreads();
      setThreads(res.data.results || []);
    } catch (e) {
      console.error('Failed to fetch threads');
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      // Filtering messages by thread in frontend assuming API supports filter, 
      // or we just fetch all and filter for now given standard viewset
      const res = await trainersAPI.listMessages({ thread: threadId });
      // DRF might not implicitly filter without django-filters, so filter locally
      const threadMsgs = (res.data.results || []).filter(m => m.thread === threadId);
      setMessages(threadMsgs);
      scrollToBottom();
    } catch (e) {
      console.error('Failed to fetch messages');
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;
    try {
      const res = await trainersAPI.createThread({ title: newThreadTitle });
      setThreads([res.data, ...threads]);
      setNewThreadTitle('');
      setShowNewThread(false);
      setActiveThread(res.data);
    } catch (e) {
      console.error('Failed to create thread', e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !activeThread) return;
    try {
      const res = await trainersAPI.createMessage({
        thread: activeThread.id,
        content: newMessageContent
      });
      setMessages([...messages, res.data]);
      setNewMessageContent('');
      scrollToBottom();
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  return (
    <div className="forum-container">
      <div className="forum-sidebar card">
        <div className="forum-sidebar-header">
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>Discussion Forum</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewThread(!showNewThread)}>
            {showNewThread ? 'Cancel' : '+ New Thread'}
          </button>
        </div>

        {showNewThread && (
          <form className="new-thread-form" onSubmit={handleCreateThread}>
            <input
              type="text"
              className="form-input"
              placeholder="Thread Title..."
              value={newThreadTitle}
              onChange={e => setNewThreadTitle(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '8px' }}>
              Create
            </button>
          </form>
        )}

        <div className="thread-list custom-scrollbar">
          {threads.length === 0 && <div className="empty-state">No threads found.</div>}
          {threads.map(thread => (
            <div
              key={thread.id}
              className={`thread-item ${activeThread?.id === thread.id ? 'active' : ''}`}
              onClick={() => setActiveThread(thread)}
            >
              <div className="thread-title">{thread.title}</div>
              <div className="thread-meta">
                <span>By {thread.created_by_details?.first_name || 'User'}</span>
                <span>{new Date(thread.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="forum-main card">
        {activeThread ? (
          <>
            <div className="chat-header">
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{activeThread.title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Started by {activeThread.created_by_details?.first_name}
              </div>
            </div>

            <div className="chat-messages custom-scrollbar">
              {messages.length === 0 && (
                <div className="empty-state">No messages yet. Start the conversation!</div>
              )}
              {messages.map(msg => {
                const isSentByMe = msg.sender === user?.id || msg.sender_details?.username === user?.username;
                return (
                  <div key={msg.id} className={`chat-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
                    <div className="chat-bubble">
                      {!isSentByMe && <div className="chat-sender-name">{msg.sender_details?.first_name || 'User'}</div>}
                      <div className="chat-content">{msg.content}</div>
                      <div className="chat-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="form-input"
                placeholder="Type your message..."
                value={newMessageContent}
                onChange={e => setNewMessageContent(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!newMessageContent.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-forum-main">
            <span style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</span>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Select a Thread</h3>
            <p style={{ color: 'var(--text-muted)' }}>Choose a thread from the sidebar or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
