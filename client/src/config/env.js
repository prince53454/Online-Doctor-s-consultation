const env = import.meta.env;

export const API_URL = env.VITE_API_URL || env.REACT_APP_API_URL || '/api';
export const SOCKET_URL = env.VITE_SOCKET_URL || env.REACT_APP_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');
export const DEMO_MODE = (env.VITE_DEMO_MODE || env.REACT_APP_DEMO_MODE) !== 'false';
export const IS_DEVELOPMENT = env.DEV;
