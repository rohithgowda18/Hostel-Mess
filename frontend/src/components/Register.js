import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register } from '../services/authService';
import './AuthPages.css';

const Register = () => {
  // Username removed
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register({ email, password });
      setSuccess('Registration successful! Please sign in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Tab switcher logic
  const isRegister = location.pathname === '/register';

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', marginBottom: 32, borderRadius: 24, background: '#f3f6fa', overflow: 'hidden' }}>
          <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: 12, textDecoration: 'none', color: isRegister ? '#fff' : '#333', background: isRegister ? '#667eea' : 'transparent', fontWeight: 600 }}>Sign Up</Link>
          <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: 12, textDecoration: 'none', color: isRegister ? '#333' : '#fff', background: isRegister ? 'transparent' : '#667eea', fontWeight: 600 }}>Log In</Link>
        </div>
        <h1 className="auth-header" style={{ textAlign: 'left', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create your account</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Create a free account to continue on our platform.</p>
        <form className="auth-form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
          {/* Username field removed */}
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="auth-button" type="submit" disabled={loading} style={{ marginBottom: 8 }}>
            {loading ? 'Signing up...' : 'Continue'}
          </button>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
        </form>
        <button className="auth-button" style={{ background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }} type="button" disabled>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{ width: 20, height: 20, borderRadius: '50%' }} />
          Continue with Google
        </button>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
