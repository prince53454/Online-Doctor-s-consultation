import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ChatHistory.css';

export default function ChatHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/consultations/my-history');
        const list = res.data.consultations || [];

        // Fetch last messages for each consultation
        const withMessages = await Promise.all(
          list.map(async (c) => {
            try {
              const msgRes = await api.get(`/consultations/${c.roomId}/messages?limit=3`);
              return { ...c, lastMessages: msgRes.data.messages || [] };
            } catch {
              return { ...c, lastMessages: [] };
            }
          })
        );

        setConsultations(withMessages);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filtered = consultations.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const otherName = user?.role === 'doctor'
        ? (c.patient?.name || '')
        : (c.doctor?.user?.name || c.doctor?.name || '');
      if (!otherName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const map = {
      'in-progress': { color: '#059669', bg: '#ecfdf5', label: 'Active' },
      'completed': { color: '#6B7280', bg: '#f3f4f6', label: 'Completed' },
      'waiting': { color: '#D97706', bg: '#fef3c7', label: 'Waiting' },
      'cancelled': { color: '#DC2626', bg: '#fef2f2', label: 'Cancelled' }
    };
    return map[status] || { color: '#6B7280', bg: '#f3f4f6', label: status };
  };

  const getOtherParty = (c) => {
    if (user?.role === 'doctor') {
      return {
        name: c.patient?.name || 'Patient',
        avatar: c.patient?.avatar,
        role: 'Patient'
      };
    }
    return {
      name: c.doctor?.user?.name || c.doctor?.name || 'Doctor',
      avatar: c.doctor?.user?.avatar || c.doctor?.avatar,
      role: c.doctor?.specialization || 'Doctor'
    };
  };

  const getLastMessage = (c) => {
    if (!c.lastMessages || c.lastMessages.length === 0) return null;
    return c.lastMessages[c.lastMessages.length - 1];
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="chat-history-page">
      <div className="container">
        {/* Header */}
        <div className="ch-header">
          <div>
            <h1>💬 Chat History</h1>
            <p className="text-muted">All your past consultations and messages</p>
          </div>
        </div>

        {/* Filters */}
        <div className="ch-filters">
          <div className="ch-search">
            <span className="ch-search-icon">🔍</span>
            <input
              type="text"
              placeholder={user?.role === 'doctor' ? 'Search by patient name...' : 'Search by doctor name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ch-search-input"
            />
          </div>
          <div className="ch-filter-tabs">
            {[
              { value: 'all', label: 'All' },
              { value: 'chat', label: '💬 Chat' },
              { value: 'video', label: '📹 Video' }
            ].map(f => (
              <button
                key={f.value}
                className={`ch-filter-btn ${filterType === f.value ? 'active' : ''}`}
                onClick={() => setFilterType(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Consultations List */}
        {filtered.length === 0 ? (
          <div className="ch-empty">
            <div className="ch-empty-icon">📭</div>
            <h3>No consultations yet</h3>
            <p>Your chat and video consultation history will appear here.</p>
            {user?.role === 'patient' && (
              <Link to="/doctors" className="btn btn-primary mt-2">Find a Doctor</Link>
            )}
          </div>
        ) : (
          <div className="ch-list">
            {filtered.map(c => {
              const other = getOtherParty(c);
              const lastMsg = getLastMessage(c);
              const badge = getStatusBadge(c.status);

              return (
                <Link
                  key={c._id}
                  to={`/chat/${c.roomId}`}
                  className="ch-card"
                >
                  {/* Avatar */}
                  <div className="ch-avatar-wrap">
                    <img
                      src={other.avatar || `https://ui-avatars.com/api/?name=${other.name}&background=4F46E5&color=fff&bold=true`}
                      alt={other.name}
                      className="ch-avatar"
                    />
                    {c.type === 'video' && <span className="ch-avatar-badge">📹</span>}
                    {c.type === 'chat' && <span className="ch-avatar-badge">💬</span>}
                  </div>

                  {/* Content */}
                  <div className="ch-content">
                    <div className="ch-top-row">
                      <h3 className="ch-name">{other.name}</h3>
                      <span className="ch-time">{formatTime(c.updatedAt || c.createdAt)}</span>
                    </div>
                    <div className="ch-meta-row">
                      <span className="ch-role">{other.role}</span>
                      <span
                        className="ch-status-badge"
                        style={{ color: badge.color, background: badge.bg }}
                      >
                        {badge.label}
                      </span>
                      <span className="ch-type">
                        {c.type === 'video' ? '📹 Video' : '💬 Chat'}
                      </span>
                    </div>
                    {lastMsg && (
                      <div className="ch-preview">
                        <span className="ch-sender">
                          {lastMsg.sender === user?.id ? 'You' : other.name.split(' ')[0]}:
                        </span>
                        <span className="ch-preview-text">
                          {lastMsg.messageType === 'file'
                            ? `📎 ${lastMsg.fileName || 'File shared'}`
                            : lastMsg.content}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="ch-arrow">›</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
