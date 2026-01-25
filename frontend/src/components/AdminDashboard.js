import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ admin, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [highPriority, setHighPriority] = useState([]);
  const [menus, setMenus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, complaintRes, priorityRes, breakfastRes, lunchRes, snacksRes, dinnerRes] = await Promise.all([
        fetch('http://localhost:8080/api/complaints/admin/stats', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/complaints/admin/all', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/complaints/admin/high-priority', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/meals/today/BREAKFAST', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/meals/today/LUNCH', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/meals/today/SNACKS', {
          headers: { 'Authorization': token }
        }),
        fetch('http://localhost:8080/api/meals/today/DINNER', {
          headers: { 'Authorization': token }
        })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (complaintRes.ok) {
        setComplaints(await complaintRes.json());
      }
      if (priorityRes.ok) {
        setHighPriority(await priorityRes.json());
      }
      
      const menuData = {};
      if (breakfastRes.ok && breakfastRes.ok) {
        const data = await breakfastRes.json();
        if (data && data.items) menuData.BREAKFAST = data;
      }
      if (lunchRes.ok) {
        const data = await lunchRes.json();
        if (data && data.items) menuData.LUNCH = data;
      }
      if (snacksRes.ok) {
        const data = await snacksRes.json();
        if (data && data.items) menuData.SNACKS = data;
      }
      if (dinnerRes.ok) {
        const data = await dinnerRes.json();
        if (data && data.items) menuData.DINNER = data;
      }
      setMenus(menuData);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/complaints/admin/${complaintId}`, {
        method: 'DELETE',
    

  const handleDeleteMenu = async (mealType) => {
    if (!window.confirm(`Are you sure you want to delete today's ${mealType} menu?`)) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/meals/admin/${mealType}/today`,
        {
          method: 'DELETE',
          headers: { 'Authorization': token }
        }
      );

      if (response.ok) {
        setError('');
        fetchDashboardData();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete menu');
      }
    } catch (err) {
      setError('Failed to delete menu');
    }
  };    headers: { 'Authorization': token }
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      setError('Failed to delete complaint');
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/complaints/admin/${complaintId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Welcome, {admin.fullName} ({admin.role})</p>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      {error && (
        <div className="error-banner">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Overview Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalComplaints}</div>
              <div className="stat-label">Total Complaints</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.needsImprovement}</div>
              <div className="stat-label">Needs Improvement</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-value">{stats.removalRequested}</div>
              <div className="stat-label">Removal Requested</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`tab ${activeTab === 'high-priority' ? 'active' : ''}`}
          onClick={() => setActiveTab('high-priority')}
        >
          🚨 High Priority ({highPriority.length})
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📂 All Complaints ({complaints.length})
        </button>
        <button
          className={`tab ${activeTab === 'menus' ? 'active' : ''}`}
          onClick={() => setActiveTab('menus')}
        >
          🍽️ Menu Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && stats && (
          <div className="overview-section">
            <h2>📈 Meal-wise Distribution</h2>
            <div className="meal-stats">
              {stats.byMealType && Object.entries(stats.byMealType).map(([meal, count]) => (
                <div key={meal} className="meal-stat">
                  <span className="meal-name">{meal}</span>
                  <div className="meal-bar" style={{ width: `${(count / stats.totalComplaints) * 100}%` }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'high-priority' && (
          <div className="complaints-section">
            <h2>🚨 High Priority Complaints (Removal Requested)</h2>
            {highPriority.length === 0 ? (
              <p className="empty-state">No high-priority complaints</p>
            ) : (
              <div className="complaints-list">
                {highPriority.map(complaint => (
                  <div key={complaint.id} className="complaint-item">
                    <div className="complaint-header">
                      <h3>{complaint.foodItem}</h3>
                      <span className="meal-badge">{complaint.mealType}</span>
                    </div>
                    <div className="complaint-stats">
                      <span>📝 Complaints: {complaint.complaintCount}</span>
                      <span>👍 Agree: {complaint.agreeVotes}</span>
                      <span>👎 Disagree: {complaint.disagreeVotes}</span>
                    </div>
                    <div className="complaint-actions">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                        <option value="REMOVAL_REQUESTED">Removal Requested</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <button
                        onClick={() => handleDeleteComplaint(complaint.id)}
                        className="delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="complaints-section">
            <h2>📂 All Complaints</h2>
            {complaints.length === 0 ? (
              <p className="empty-state">No complaints yet</p>
            ) : (
              <div className="complaints-list">
                {complaints.map(complaint => (
                  <div key={complaint.id} className="complaint-item">
                    <div className="complaint-header">
                      <h3>{complaint.foodItem}</h3>
                      <span className={`status-badge ${complaint.status.toLowerCase()}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className="complaint-details">
                      <span className="meal-badge">{complaint.mealType}</span>
                      <span className="date-badge">{complaint.date}</span>
                    </div>
                    <div className="complaint-stats">
                      <span>📝 Complaints: {complaint.complaintCount}</span>
                      <span>👍 Agree: {complaint.agreeVotes}</span>
                      <span>👎 Disagree: {complaint.disagreeVotes}</span>
                    </div>
                    <div className="complaint-actions">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                        <option value="REMOVAL_REQUESTED">Removal Requested</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <button
                        onClick={() => handleDeleteComplaint(complaint.id)}
                        className="delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'menus' && (
          <div className="menus-section">
            <h2>🍽️ Today's Menu Management</h2>
            <div className="menus-grid">
              {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map(mealType => (
                <div key={mealType} className="menu-card">
                  <div className="menu-header">
                    <h3>{mealType}</h3>
                    {menus[mealType] ? (
                      <span className="menu-status">✅ Posted</span>
                    ) : (
                      <span className="menu-status empty">⭕ Not Posted</span>
                    )}
                  </div>
                  
                  {menus[mealType] ? (
                    <>
                      <div className="menu-items">
                        <h4>Items:</h4>
                        <ul>
                          {menus[mealType].items && menus[mealType].items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => handleDeleteMenu(mealType)}
                        className="delete-menu-btn"
                      >
                        🗑️ Delete Menu
                      </button>
                    </>
                  ) : (
                    <p className="no-menu">No menu posted for today</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
