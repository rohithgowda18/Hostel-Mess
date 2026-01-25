import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h1>🔐 Admin Login</h1>
        <p className="subtitle">Mess Management System</p>

        {error && (
          <div className="admin-login-error">
            <span>❌ {error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="admin-login-btn"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="demo-note">
          Demo: username: <strong>admin</strong> | password: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
