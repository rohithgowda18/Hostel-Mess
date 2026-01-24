import React, { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import MealTabs from './components/MealTabs';
import FoodGrid from './components/FoodGrid';
import TodayMenuDisplay from './components/TodayMenuDisplay';
import { getMealDisplayName } from './data/foodData';
import './App.css';

function App() {
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
      setMessage({ type: 'error', text: 'Please select at least one food item.' });
      return;
    }

    setPosting(true);
    setMessage({ type: '', text: '' });

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      const result = await api.updateMeal(activeMeal, today, selectedItems);

      // Update the display with new data
      setTodayMenu(result);

      // Clear selection and show success
      setSelectedItems([]);
      setMessage({ type: 'success', text: `${getMealDisplayName(activeMeal)} menu posted successfully! 🎉` });
    } catch (error) {
      console.error('Failed to post menu:', error);
      setMessage({ type: 'error', text: 'Failed to post menu. Please try again.' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>🍽️ Hostel Mess Live Menu</h1>
        <p>View and update today's food menu</p>
      </header>

      {/* Meal Tabs */}
      <MealTabs activeMeal={activeMeal} onMealChange={handleMealChange} />

      {/* Today's Menu Display */}
      <TodayMenuDisplay
        mealType={activeMeal}
        menuData={todayMenu}
        loading={loading}
      />

      {/* Post Menu Section */}
      <div className="post-menu-card">
        <h2>📝 Update {getMealDisplayName(activeMeal)} Menu</h2>
        <p className="selection-hint">Click on food items to select them</p>

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
      </div>
    </div>
  );
}

export default App;
