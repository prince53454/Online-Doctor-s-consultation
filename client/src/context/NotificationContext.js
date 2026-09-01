import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Connect to Socket.IO and join user room
  useEffect(() => {
    if (!user) return;

    const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const newSocket = io(socketUrl, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-user', user.id);
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Show toast for real-time notifications
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 5000,
        style: {
          background: '#1a1a2e',
          color: '#fff',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=20');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      socket,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

function getNotificationIcon(type) {
  const icons = {
    appointment_booked: '📅',
    appointment_confirmed: '✅',
    appointment_cancelled: '❌',
    appointment_rescheduled: '🔄',
    payment_received: '💰',
    payment_failed: '💸',
    new_message: '💬',
    video_call_started: '📹',
    video_call_ended: '📞',
    prescription_shared: '📋',
    doctor_approved: '👨‍⚕️',
    doctor_rejected: '🚫',
    reminder_24h: '⏰',
    reminder_1h: '⏰',
    review_received: '⭐'
  };
  return icons[type] || '🔔';
}
