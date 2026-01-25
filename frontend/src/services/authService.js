/**
 * Authentication service - Disabled
 * All authentication has been removed from the application.
 * These functions are kept as stubs for backward compatibility.
 */

/**
 * Stub - Authentication disabled
 */
export const register = async () => {
  throw new Error('Authentication has been disabled');
};

/**
 * Stub - Authentication disabled
 */
export const login = async () => {
  throw new Error('Authentication has been disabled');
};

/**
 * Stub - Authentication disabled
 */
export const logout = () => {
  console.log('Authentication has been disabled');
};

/**
 * Stub - Returns null
 */
export const getToken = () => {
  return null;
};

/**
 * Stub - Returns null
 */
export const getUser = () => {
  return null;
};

/**
 * Stub - Always returns false
 */
export const isAuthenticated = () => {
  return false;
};

/**
 * Stub - Returns empty object
 */
export const getAuthHeader = () => {
  return {};
};

/**
 * Stub - Direct fetch without auth
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

