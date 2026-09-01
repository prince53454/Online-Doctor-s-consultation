import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationBell from '../NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#grad1)" />
              <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#4F46E5"/>
                  <stop offset="1" stopColor="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-text">Medi<span>Connect</span></span>
        </Link>

        <div className={`navbar-menu ${mobileOpen ? 'active' : ''}`}>
          <Link to="/doctors" className="nav-link" onClick={() => setMobileOpen(false)}>
            {t('nav_findDoctors')}
          </Link>
          <Link to="/labs" className="nav-link" onClick={() => setMobileOpen(false)}>
            🔬 Lab Tests
          </Link>
          <Link to="/pharmacy" className="nav-link" onClick={() => setMobileOpen(false)}>
            💊 Pharmacy
          </Link>
          <Link to="/ai-checker" className="nav-link" onClick={() => setMobileOpen(false)}>
            {t('nav_aiCheck')}
          </Link>
          {user && user.role === 'patient' && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                📊 Dashboard
              </Link>
              <Link to="/appointments" className="nav-link" onClick={() => setMobileOpen(false)}>
                {t('nav_appointments')}
              </Link>
              <Link to="/reports" className="nav-link" onClick={() => setMobileOpen(false)}>
                {t('nav_reports')}
              </Link>
              <Link to="/medical-records" className="nav-link" onClick={() => setMobileOpen(false)}>
                📋 {t('nav_records')}
              </Link>
              <Link to="/chat-history" className="nav-link" onClick={() => setMobileOpen(false)}>
                💬 Chat History
              </Link>
              <Link to="/call-history" className="nav-link" onClick={() => setMobileOpen(false)}>
                📞 Call History
              </Link>
            </>
          )}
          {user && user.role === 'doctor' && (
            <>
              {user.isApproved !== false && (
                <Link to="/doctor/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              )}
              {user.isApproved === false && (
                <Link to="/doctor/pending" className="nav-link" onClick={() => setMobileOpen(false)}>
                  ⏳ Approval Pending
                </Link>
              )}
              <Link to="/appointments" className="nav-link" onClick={() => setMobileOpen(false)}>
                Appointments
              </Link>
              {user.isApproved !== false && (
                <Link to="/earnings" className="nav-link" onClick={() => setMobileOpen(false)}>
                  💰 Earnings
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-actions">
          <button className="lang-toggle" onClick={toggleLanguage} title="Switch Language">
            {lang === 'en' ? '🇮🇳 हिं' : '🇬🇧 EN'}
          </button>
          {user && <NotificationBell />}
          {user ? (
            <div className="user-menu">
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4F46E5&color=fff`}
                  alt={user.name}
                  className="user-avatar"
                />
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <svg className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <img src={user.avatar} alt="" className="dropdown-avatar" />
                    <div>
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-role">{user.role}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />                      <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        👤 My Profile
                      </Link>
                      {user.role === 'patient' && (
                        <>
                          <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            📊 Dashboard
                          </Link>
                          <Link to="/appointments" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📅 My Appointments
                      </Link>
                      <Link to="/reports" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📋 My Reports
                      </Link>
                      <Link to="/medical-records" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        🏥 Medical Records
                      </Link>
                      <Link to="/health-metrics" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📊 Health Metrics
                      </Link>
                      <Link to="/chat-history" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        💬 Chat History
                      </Link>
                      <Link to="/call-history" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📞 Call History
                      </Link>
                      <Link to="/pharmacy" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        💊 Online Pharmacy
                      </Link>
                      <Link to="/pharmacy/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📦 My Pharmacy Orders
                      </Link>
                    </>
                  )}
                  {user.role === 'doctor' && (
                    <>
                      {user.isApproved !== false && (
                        <Link to="/doctor/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          📊 Dashboard
                        </Link>
                      )}
                      {user.isApproved === false && (
                        <Link to="/doctor/pending" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          ⏳ Pending Approval
                        </Link>
                      )}
                      <Link to="/appointments" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        📅 Appointments
                      </Link>
                    </>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
