import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
