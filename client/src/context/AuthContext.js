import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getMockUser, isBackendAvailable, setDemoMode, isDemoMode, clearDemoMode } from '../services/mockData';

const AuthContext = createContext(null);

// Auto-login credentials for preview routes — real accounts from the database
const PREVIEW_ACCOUNTS = {
  '/doctor/dashboard': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/doctor/appointments': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/doctor/earnings': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/doctor/profile': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/doctor/patients': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/doctor/pending': { email: 'dr.rajesh@mediconnect.com', password: 'doctor123', role: 'doctor' },
  '/admin': { email: 'admin@mediconnect.com', password: 'admin123', role: 'admin' },
};

// Check if the current URL is a preview route that should auto-login
function getPreviewCredentials() {
  // 1. Check window.__MEDICONNECT_PORTAL__ (injected by index.html before React loads)
  const windowPortal = window.__MEDICONNECT_PORTAL__;
  if (windowPortal && ['patient', 'doctor', 'admin'].includes(windowPortal)) {
    localStorage.setItem('mediconnect_portal', windowPortal);
  }
  // 2. Check localStorage portal flag (set by injected index.html)
  const storedPortal = windowPortal || localStorage.getItem('mediconnect_portal');
  if (storedPortal) {
    const creds = PREVIEW_ACCOUNTS['/' + (storedPortal === 'doctor' ? 'doctor/dashboard' : storedPortal === 'admin' ? 'admin' : '')] || { email: 'patient@mediconnect.com', password: 'patient123', role: storedPortal };
    return creds;
  }

  // 2. Check ?portal= query parameter
  const params = new URLSearchParams(window.location.search);
  const portalParam = params.get('portal');
  if (portalParam && ['patient', 'doctor', 'admin'].includes(portalParam)) {
    localStorage.setItem('mediconnect_portal', portalParam);
    if (portalParam === 'doctor') return PREVIEW_ACCOUNTS['/doctor/dashboard'];
    if (portalParam === 'admin') return PREVIEW_ACCOUNTS['/admin'];
    return { email: 'patient@mediconnect.com', password: 'patient123', role: 'patient' };
  }

  // 3. Check URL path (handles GitHub Pages subpath like /Online-Doctor-s-consultation/...)
  const fullPath = window.location.pathname;
  const path = fullPath.replace(/^\/[^/]+/, '') || '/'; // strip base path for GH Pages
  if (PREVIEW_ACCOUNTS[path]) return PREVIEW_ACCOUNTS[path];
  if (path.startsWith('/doctor/')) return PREVIEW_ACCOUNTS['/doctor/dashboard'];
  if (path.startsWith('/admin')) return PREVIEW_ACCOUNTS['/admin'];
  if (path === '/' || path.startsWith('/doctors') || path.startsWith('/pharmacy') ||
      path.startsWith('/labs') || path.startsWith('/ai-checker') ||
      path.startsWith('/appointments') || path.startsWith('/reports') ||
      path.startsWith('/medical-records') || path.startsWith('/profile') ||
      path.startsWith('/chat-history') || path.startsWith('/call-history') ||
      path.startsWith('/health-metrics') || path.startsWith('/dashboard') ||
      path.startsWith('/book/') || path.startsWith('/chat/') || path.startsWith('/video/')) {
    return { email: 'patient@mediconnect.com', password: 'patient123', role: 'patient' };
  }
  // Fallback: if on GitHub Pages (subpath exists), default to patient
  if (fullPath !== '/' && fullPath !== '') {
    return { email: 'patient@mediconnect.com', password: 'patient123', role: 'patient' };
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const loadUser = useCallback(async () => {
    // Check if backend is available
    const backendUp = await isBackendAvailable();
    
    if (!backendUp) {
      // DEMO MODE — no backend, use mock data
      setDemoMode();
      const creds = getPreviewCredentials();
      const role = creds?.role || 'patient';
      const mockUser = getMockUser(role);
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Backend is available — use real auth
    clearDemoMode();
    
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        const userData = { ...res.data.user };
        if (res.data.doctorProfile) {
          userData.isApproved = res.data.doctorProfile.isApproved;
          userData.doctorProfile = res.data.doctorProfile;
        }
        const path = window.location.pathname;
        const creds = getPreviewCredentials();
        if (creds && userData.role !== creds.role) {
          const reLogin = await api.post('/auth/login', creds);
          const { token: newToken, user: newUserData, doctorProfile: newDP } = reLogin.data;
          localStorage.setItem('token', newToken);
          setToken(newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          if (newDP) { newUserData.isApproved = newDP.isApproved; newUserData.doctorProfile = newDP; }
          setUser(newUserData);
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    const creds = getPreviewCredentials();
    if (creds) {
      try {
        const res = await api.post('/auth/login', creds);
        const { token: newToken, user: userData, doctorProfile } = res.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        if (doctorProfile) {
          userData.isApproved = doctorProfile.isApproved;
          userData.doctorProfile = doctorProfile;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auto-login failed:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);    const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData, doctorProfile } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Attach doctor approval status
    if (doctorProfile) {
      userData.isApproved = doctorProfile.isApproved;
      userData.doctorProfile = doctorProfile;
    }
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
