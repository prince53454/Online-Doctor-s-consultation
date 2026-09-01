import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import './DoctorNavbar.css';

const NAV_ITEMS = [
  { path: '/doctor/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { path: '/doctor/chat-history', label: 'Chat History', icon: '💬' },
  { path: '/doctor/call-history', label: 'Call History', icon: '📞' },
  { path: '/doctor/earnings', label: 'Earnings', icon: '💰' },
  { path: '/doctor/profile', label: 'Profile', icon: '👤' },
];

export default function DoctorNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`doc-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="doc-sidebar-brand">
        <Link to="/doctor/dashboard" className="doc-brand-link">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#docGrad)" />
            <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="docGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#059669" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          {!collapsed && <span className="doc-brand-text">Medi<span>Connect</span></span>}
        </Link>
        <button className="doc-sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* Doctor Info */}
      {!collapsed && user && (
        <div className="doc-sidebar-profile">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=059669&color=fff&bold=true`}
            alt={user.name}
            className="doc-profile-avatar"
          />
          <div className="doc-profile-info">
            <div className="doc-profile-name">{user.name}</div>
            <div className="doc-profile-role">Doctor</div>
          </div>
        </div>
      )}
      {collapsed && user && (
        <Link to="/doctor/profile" className="doc-sidebar-avatar-link">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=059669&color=fff&bold=true`}
            alt={user.name}
            className="doc-profile-avatar-sm"
            title={user.name}
          />
        </Link>
      )}

      {/* Navigation */}
      <nav className="doc-sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`doc-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="doc-nav-icon">{item.icon}</span>
              {!collapsed && <span className="doc-nav-label">{item.label}</span>}
              {isActive && <span className="doc-nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="doc-sidebar-bottom">
        {!collapsed && (
          <div className="doc-sidebar-notification">
            <NotificationBell />
          </div>
        )}

        {collapsed && (
          <div className="doc-sidebar-notification-sm">
            <NotificationBell />
          </div>
        )}

        <button className="doc-logout-btn" onClick={handleLogout} title="Logout">
          <span className="doc-nav-icon">🚪</span>
          {!collapsed && <span className="doc-nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
