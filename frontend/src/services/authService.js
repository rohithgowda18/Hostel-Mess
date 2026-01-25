
// Authentication service - JWT based
const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8080/api';

export const register = async (registerData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  return await response.json();
};

export const login = async (loginData) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  const data = await response.json();
  localStorage.setItem('jwtToken', data.token);
  localStorage.setItem('userInfo', JSON.stringify(data.userInfo || {}));
  return data;
};

export const logout = () => {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('userInfo');
};

export const getToken = () => {
  return localStorage.getItem('jwtToken');
};

export const getUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authenticatedFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };
  return fetch(url, {
    ...options,
    headers,
  });
};

