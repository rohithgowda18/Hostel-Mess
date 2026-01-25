import React, { useState } from 'react';
import './MealGoingButton.css';

const MealGoingButton = ({ groupId, mealType, userId, onVoteChange, isUserGoing }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggleGoing = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = isUserGoing 
        ? `http://localhost:8080/api/group-meal-status/${groupId}/${mealType}/${userId}`
        : 'http://localhost:8080/api/group-meal-status/going';

      const options = {
        method: isUserGoing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      if (!isUserGoing) {
        options.body = JSON.stringify({ groupId, mealType, userId });
      }

      const response = await fetch(endpoint, options);

      if (response.ok) {
        const data = await response.json();
        onVoteChange(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const mealEmojis = {
    BREAKFAST: '🍳',
    LUNCH: '🍛',
    SNACKS: '☕',
    DINNER: '🌙'
  };

  return (
    <div className="meal-going-button">
      <button
        className={`going-btn ${isUserGoing ? 'going' : 'not-going'}`}
        onClick={handleToggleGoing}
        disabled={loading}
        title={isUserGoing ? 'Mark as not going' : 'Mark as going'}
      >
        <span className="emoji">{mealEmojis[mealType] || '🍽️'}</span>
        <span className="text">
          {loading ? 'Updating...' : (isUserGoing ? '✓ Going' : '✗ Not Going')}
        </span>
      </button>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export default MealGoingButton;
