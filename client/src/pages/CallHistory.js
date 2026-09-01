import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './CallHistory.css';

export default function CallHistory() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/consultations/my-history');
        setConsultations(res.data.consultations || []);
      } catch (error) {
        console.error('Failed to load call history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = consultations.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'video') return c.type === 'video';
    if (filter === 'chat') return c.type === 'chat';
    if (filter === 'active') return c.status === 'in-progress';
    return true;
  });

  const getOtherParty = (c) => {
    if (user?.role === 'doctor') {
      return { name: c.patient?.name || 'Patient', avatar: c.patient?.avatar, role: 'Patient' };
    }
    return {
      name: c.doctor?.user?.name || c.doctor?.name || 'Doctor',
      avatar: c.doctor?.user?.avatar || c.doctor?.avatar,
      role: c.doctor?.specialization || 'Doctor'
    };
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="ch-history-page">
      <div className="container">
        <div className="ch-h-header">
          <div>
            <h1>📞 Call History</h1>
            <p className="text-muted">All your video calls, chat sessions, and consultation records</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="ch-h-stats">
          <div className="ch-h-stat">
            <span className="ch-h-stat-icon">📹</span>
            <div>
              <span className="ch-h-stat-value">{consultations.filter(c => c.type === 'video').length}</span>
              <span className="ch-h-stat-label">Video Calls</span>
            </div>
          </div>
          <div className="ch-h-stat">
            <span className="ch-h-stat-icon">💬</span>
            <div>
              <span className="ch-h-stat-value">{consultations.filter(c => c.type === 'chat').length}</span>
              <span className="ch-h-stat-label">Chat Sessions</span>
            </div>
          </div>
          <div className="ch-h-stat">
            <span className="ch-h-stat-icon">⏱️</span>
            <div>
              <span className="ch-h-stat-value">{consultations.reduce((sum, c) => sum + (c.duration || 0), 0)} min</span>
              <span className="ch-h-stat-label">Total Duration</span>
            </div>
          </div>
          <div className="ch-h-stat">
            <span className="ch-h-stat-icon">✅</span>
            <div>
              <span className="ch-h-stat-value">{consultations.filter(c => c.status === 'completed').length}</span>
              <span className="ch-h-stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ch-h-filters">
          {[
            { value: 'all', label: 'All Calls' },
            { value: 'video', label: '📹 Video' },
            { value: 'chat', label: '💬 Chat' },
            { value: 'active', label: '🟢 Active' }
          ].map(f => (
            <button key={f.value} className={`ch-h-filter-btn ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Call List */}
        {filtered.length === 0 ? (
          <div className="ch-h-empty">
            <span>📭</span>
            <h3>No call history yet</h3>
            <p>Your video calls and chat sessions will appear here after your first consultation.</p>
            <Link to="/doctors" className="btn btn-primary mt-2">Book a Consultation</Link>
          </div>
        ) : (
          <div className="ch-h-list">
            {filtered.map(c => {
              const other = getOtherParty(c);
              return (
                <div key={c._id} className="ch-h-card">
                  <div className="ch-h-card-left">
                    <div className="ch-h-avatar-wrap">
                      <img src={other.avatar || `https://ui-avatars.com/api/?name=${other.name}&background=4F46E5&color=fff&bold=true`} alt="" className="ch-h-avatar" />
                      <span className="ch-h-type-badge">{c.type === 'video' ? '📹' : '💬'}</span>
                    </div>
                  </div>

                  <div className="ch-h-card-main">
                    <div className="ch-h-row-top">
                      <div>
                        <h3>{other.name}</h3>
                        <p className="ch-h-role">{other.role}</p>
                      </div>
                      <div className="ch-h-meta">
                        <span className="ch-h-date">{formatDate(c.createdAt)}</span>
                        <span className={`ch-h-status ch-h-status-${c.status === 'completed' ? 'done' : c.status === 'in-progress' ? 'live' : 'wait'}`}>
                          {c.status === 'completed' ? '✅ Completed' : c.status === 'in-progress' ? '🟢 Active' : '⏳ Waiting'}
                        </span>
                      </div>
                    </div>

                    <div className="ch-h-details">
                      <span className="ch-h-detail">🕐 {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="ch-h-detail">⏱️ {formatDuration(c.duration)}</span>
                      <span className="ch-h-detail">💬 {(c.messages?.length || 0)} messages</span>
                      {c.type === 'video' && <span className="ch-h-detail">📹 Video Call</span>}
                      {c.type === 'chat' && <span className="ch-h-detail">💬 Chat Session</span>}
                    </div>

                    {/* Last Message Preview */}
                    {c.messages && c.messages.length > 0 && (
                      <div className="ch-h-last-msg">
                        <strong>Last message:</strong> {c.messages[c.messages.length - 1]?.content?.substring(0, 80)}
                        {c.messages[c.messages.length - 1]?.content?.length > 80 && '...'}
                      </div>
                    )}
                  </div>

                  <div className="ch-h-card-actions">
                    {c.status === 'in-progress' && (
                      <Link to={c.type === 'video' ? `/video/${c.roomId}` : `/chat/${c.roomId}`} className="btn btn-success btn-sm">
                        Join {c.type === 'video' ? '📹' : '💬'}
                      </Link>
                    )}
                    {c.status === 'completed' && c.type === 'chat' && (
                      <Link to={`/chat/${c.roomId}`} className="btn btn-ghost btn-sm">View Chat</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
