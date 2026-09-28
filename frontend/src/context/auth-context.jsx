import { createContext, useContext, useState, useEffect } from 'react';
import {
  getUser,
  getToken,
  isAuthenticated as checkAuth,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout
} from '@/services/auth-service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getUser());
      setToken(getToken());
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user || getUser());
      setToken(data.token || getToken());
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await apiRegister(payload);
      setUser(data.user || getUser());
      setToken(data.token || getToken());
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setToken(null);
  };

  const authenticated = Boolean(token && user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: authenticated,
        isAdmin,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
