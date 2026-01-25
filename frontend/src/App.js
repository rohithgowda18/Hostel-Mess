import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import api from './services/api';
import MealTabs from './components/MealTabs';
import FoodGrid from './components/FoodGrid';
import TodayMenuDisplay from './components/TodayMenuDisplay';
import MessVoice from './components/MessVoice';
import GroupDashboard from './components/GroupDashboard';
import GroupChatPage from './components/GroupChatPage';
import UniversalChatPage from './components/UniversalChatPage';
import { getMealDisplayName } from './data/foodData';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import { getUser } from './services/authService';
import './App.css';

/**
 * Main dashboard page component
 */
function Dashboard() {
  // State for navigation between pages
  const [currentPage, setCurrentPage] = useState('menu'); // 'menu', 'complaints', 'groups'

  // State for active meal tab
  const [activeMeal, setActiveMeal] = useState('BREAKFAST');

  // State for today's menu display
  const [todayMenu, setTodayMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for posting menu
  const [selectedItems, setSelectedItems] = useState([]);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch today's menu for active meal type
  const fetchTodayMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTodayMeal(activeMeal);
      console.log('Fetched menu data:', data);
      setTodayMenu(data);
    } catch (error) {
      console.error(`Failed to fetch ${activeMeal}:`, error);
      setMessage({ type: 'error', text: `Failed to load today's menu. Please try again.` });
    } finally {
      setLoading(false);
    }
  }, [activeMeal]);

  // Fetch menu when meal type changes
  useEffect(() => {
    fetchTodayMenu();
    // Clear selection when switching tabs
    setSelectedItems([]);
    setMessage({ type: '', text: '' });
  }, [fetchTodayMenu]);

  // Handle meal tab change
  const handleMealChange = (meal) => {
    setActiveMeal(meal);
  };

  // Handle food item toggle
  const handleItemToggle = (itemName) => {
    setSelectedItems(prev => {
      if (prev.includes(itemName)) {
        return prev.filter(i => i !== itemName);
      } else {
        return [...prev, itemName];
      }
    });
    // Clear any previous messages
    setMessage({ type: '', text: '' });
  };

  // Handle post menu
  const handlePostMenu = async () => {
    if (selectedItems.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one item' });
      return;
    }

    setPosting(true);
    setMessage({ type: '', text: '' });

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.updateMeal(activeMeal, today, selectedItems);

      if (response && response.mealType) {
        setMessage({
          type: 'success',
          text: `✅ ${getMealDisplayName(activeMeal)} updated successfully!`,
        });
        setSelectedItems([]);
        // Refresh menu
        await fetchTodayMenu();
      } else {
        setMessage({ type: 'error', text: 'Failed to update menu. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update menu. Please try again.' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div>
            <h1>🍽️ Hostel Mess Menu</h1>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${currentPage === 'menu' ? 'active' : ''}`}
          onClick={() => setCurrentPage('menu')}
        >
          📋 Menu
        </button>
        <button
          className={`nav-tab ${currentPage === 'groups' ? 'active' : ''}`}
          onClick={() => setCurrentPage('groups')}
        >
          👥 Groups
        </button>
        <button
          className={`nav-tab ${currentPage === 'complaints' ? 'active' : ''}`}
          onClick={() => setCurrentPage('complaints')}
        >
          💬 Feedback
        </button>
        <a href="/community" className="nav-tab">
          🌍 Community Chat
        </a>
      </nav>

      {/* Menu Page */}
      {currentPage === 'menu' && (
        <>
          <MealTabs activeMeal={activeMeal} onMealChange={handleMealChange} />

          <TodayMenuDisplay
            mealType={activeMeal}
            menuData={todayMenu}
            loading={loading}
          />

          {!loading && (
            <>
              <FoodGrid
                mealType={activeMeal}
                selectedItems={selectedItems}
                onItemToggle={handleItemToggle}
              />

              {selectedItems.length > 0 && (
                <div className="selected-summary">
                  <strong>Selected ({selectedItems.length}):</strong> {selectedItems.join(', ')}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handlePostMenu}
                disabled={posting || selectedItems.length === 0}
              >
                {posting ? 'Posting...' : 'Post Menu'}
              </button>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Groups Page */}
      {currentPage === 'groups' && (
        <GroupDashboard userId={getUser()?.id || ''} />
      )}

      {/* Feedback Page */}
      {currentPage === 'complaints' && (
        <MessVoice />
      )}
    </div>
  );
}

/**
 * Main App component with routing
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Main Dashboard - Default Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Community Chat Route */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <header className="header">
                  <div className="header-content">
                    <div>
                      <h1>🍽️ Hostel Mess Menu</h1>
                    </div>
                  </div>
                </header>
                <nav className="nav-tabs">
                  <a href="/dashboard" className="nav-tab">📋 Menu</a>
                  <a href="/dashboard" className="nav-tab">👥 Groups</a>
                  <span className="nav-tab active">🌍 Community</span>
                </nav>
                <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
                  <UniversalChatPage currentUser={getUser() || {}} />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        {/* Group Chat Route */}
        <Route
          path="/groups/:groupId/chat"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <header className="header">
                  <div className="header-content">
                    <div>
                      <h1>🍽️ Hostel Mess Menu</h1>
                    </div>
                  </div>
                </header>
                <nav className="nav-tabs">
                  <a href="/dashboard" className="nav-tab">📋 Menu</a>
                  <a href="/dashboard" className="nav-tab">👥 Groups</a>
                  <span className="nav-tab active">💬 Group Chat</span>
                </nav>
                <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
                  <GroupChatPage currentUser={getUser() || {}} />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
