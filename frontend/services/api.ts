import axios from 'axios';

// Base URL for the backend (strictly without /api suffix)
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BACKEND_URL = rawUrl.replace(/\/api$/, '');

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                         error.config?.url?.includes('/auth/register') ||
                         error.config?.url?.includes('/auth/forgot-password');

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const hadToken = !!localStorage.getItem('token');
      
      // Clear invalid session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we were actually "logged in" (had a token) 
      // and this isn't a login attempt failing.
      if (hadToken && !isAuthRequest) {
          // Force refresh to clear all app state and show onboarding
          window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
