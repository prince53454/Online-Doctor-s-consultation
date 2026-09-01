import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    const icons = {
      appointment_booked: '📅', appointment_confirmed: '✅', appointment_cancelled: '❌',
      appointment_rescheduled: '🔄', payment_received: '💰', payment_failed: '💸',
      new_message: '💬', video_call_started: '📹', video_call_ended: '📞',
      prescription_shared: '📋', review_received: '⭐', reminder_24h: '⏰',
      reminder_1h: '⏰', doctor_approved: '👨‍⚕️', doctor_rejected: '🚫'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notification-bell" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map(notif => (
                <div
                  key={notif._id}
                  className={`notif-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                >
                  <span className="notif-icon">{getIcon(notif.type)}</span>
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <span className="notif-dot" />}
                  <button className="notif-delete" onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif._id);
                  }}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
