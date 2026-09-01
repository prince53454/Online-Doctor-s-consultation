import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — only auto-redirect on 401 for pages that require auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isOnLoginPage = window.location.pathname === '/login';
    const isOnPreviewPage = [
      '/admin', '/doctor/', '/login', '/register', '/forgot-password'
    ].some(p => window.location.pathname.startsWith(p));

    if (error.response?.status === 401 && !isOnPreviewPage && !isOnLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
