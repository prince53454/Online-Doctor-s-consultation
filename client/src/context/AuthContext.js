import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getMockUser, isBackendAvailable, setDemoMode, clearDemoMode } from '../services/mockData';
import { DEMO_MODE as demoModeEnabled } from '../config/env';

const AuthContext = createContext(null);

function getPreviewRole() {
  const injectedPortal = window.__MEDICONNECT_PORTAL__;
  const queryPortal = new URLSearchParams(window.location.search).get('portal');
  const storedPortal = localStorage.getItem('mediconnect_portal');
  const role = [injectedPortal, queryPortal, storedPortal].find(value => ['patient', 'doctor'].includes(value));
  if (role) localStorage.setItem('mediconnect_portal', role);
  if (!role) localStorage.removeItem('mediconnect_portal');
  return role || 'patient';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const loadUser = useCallback(async () => {
    // Check if backend is available
    const backendUp = await isBackendAvailable();
    
    if (!backendUp) {
      if (demoModeEnabled) {
        setDemoMode();
        let role = getPreviewRole();
        if (token) {
          if (token.includes('doctor')) role = 'doctor';
          else if (token.includes('admin')) role = 'admin';
          else if (token.includes('patient')) role = 'patient';
        }
        setUser(getMockUser(role));
      } else {
        clearDemoMode();
        setUser(null);
      }
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
        if (userData.role === 'doctor') {
          userData.isApproved = Boolean(res.data.doctorProfile?.isApproved);
          userData.doctorProfile = res.data.doctorProfile || null;
        }
        setUser(userData);
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

    setLoading(false);
  }, [token]);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    const userData = { ...res.data.user };
    if (userData.role === 'doctor') {
      userData.isApproved = Boolean(res.data.doctorProfile?.isApproved);
      userData.doctorProfile = res.data.doctorProfile || null;
    }
    setUser(userData);
    return userData;
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);    const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData, doctorProfile } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Attach doctor approval status
    if (userData.role === 'doctor') {
      userData.isApproved = Boolean(doctorProfile?.isApproved);
      userData.doctorProfile = doctorProfile || null;
    }
    setUser(userData);
    return userData;
  };

  const adminAccess = async (password) => {
    const res = await api.post('/auth/admin-access', { password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    if (userData.role === 'doctor') {
      userData.isApproved = false;
      userData.doctorProfile = null;
    }
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
    <AuthContext.Provider value={{ user, loading, login, adminAccess, register, logout, updateUser, refreshUser, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
