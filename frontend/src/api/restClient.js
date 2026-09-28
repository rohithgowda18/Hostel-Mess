import axios from 'axios';
import { API_BASE_URL } from './endpoints';

export const restClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT Bearer token into outgoing requests
restClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401 Unauthorized responses
restClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname === '/login';
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        // Do not force redirect if already checking credentials
      }
    }
    return Promise.reject(error);
  }
);

export default restClient;
