import React from 'react';
import './AuthPages.css';

/**
 * Login page - Disabled
 * Authentication has been removed from the application.
 */
const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Authentication Disabled</h1>
        <p>Authentication has been removed from this application.</p>
        <p>Please proceed to the <a href="/dashboard">Dashboard</a></p>
      </div>
    </div>
  );
};

export default Login;
