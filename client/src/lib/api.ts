import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_URL || 'https://quick-dine-ruddy.vercel.app/api';

// Fallback/auto-correct if an outdated server URL was configured in Vercel environment variables
if (rawBaseURL.includes('quick-dine-server.vercel.app')) {
  rawBaseURL = rawBaseURL.replace('quick-dine-server.vercel.app', 'quick-dine-ruddy.vercel.app');
}

// Auto-upgrade insecure http:// to https:// in production to prevent Mixed Content errors
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  rawBaseURL.startsWith('http://') &&
  !rawBaseURL.includes('localhost') &&
  !rawBaseURL.includes('127.0.0.1')
) {
  rawBaseURL = rawBaseURL.replace('http://', 'https://');
}

const api = axios.create({
  baseURL: rawBaseURL,
});

// Requests interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
