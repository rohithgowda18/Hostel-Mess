import axios from 'axios';
import { API_BASE_URL, getAuthHeader, logout } from '@/services/auth-service';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const authHeader = getAuthHeader();
  if (authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

let isRedirectingToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      logout();
      window.dispatchEvent(new Event('auth-change'));
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?session=expired');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
