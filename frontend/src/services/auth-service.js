const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

const TOKEN_KEY = 'jwtToken';
const USER_KEY = 'userInfo';

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();

  if (!rawBody) {
    return {};
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON from API but received ${contentType || 'unknown content type'}. ` +
      `Check VITE_API_BASE and backend deployment. Response starts with: ${rawBody.slice(0, 120)}`
    );
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error(`Invalid JSON response from API. Response starts with: ${rawBody.slice(0, 120)}`);
  }
}

export async function register(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Registration failed');
  }

  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data.user || data.userInfo) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user || data.userInfo));
  }

  return data;
}

export async function login(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Login failed');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user || data.userInfo || {}));

  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { API_BASE_URL };
