const env = import.meta.env;

export const API_URL = env.VITE_API_URL || env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = env.VITE_SOCKET_URL || env.REACT_APP_SOCKET_URL ||
  API_URL.replace(/\/api\/?$/, '');
export const DEMO_MODE = (env.VITE_DEMO_MODE || env.REACT_APP_DEMO_MODE) === 'true';
export const IS_DEVELOPMENT = env.DEV;
