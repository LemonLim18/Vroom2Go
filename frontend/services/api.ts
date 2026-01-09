import axios from 'axios';

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
    if (error.response && error.response.status === 401) {
      // Clear invalid token and redirect to login if not already there
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Avoid redirect loops if already on login page
      if (!window.location.pathname.includes('login') && !window.location.pathname.includes('onboarding')) {
        // Optional: Redirect to login or show auth modal
        // window.location.href = '/onboarding'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
