import React, { useState } from 'react';
import './GroupStatusList.css';

const GroupStatusList = ({ group, groupMembers, onRefresh }) => {
  const [mealStatus, setMealStatus] = useState({});
  const [loading, setLoading] = useState({});

  const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
  const mealEmojis = {
    BREAKFAST: '🍳',
    LUNCH: '🍛',
    SNACKS: '☕',
    DINNER: '🌙'
  };

  const fetchMealStatus = async (mealType) => {
    setLoading(prev => ({ ...prev, [mealType]: true }));
    
    try {
      const response = await fetch(
        `http://localhost:8080/api/group-meal-status/${group.id}/${mealType}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMealStatus(prev => ({ ...prev, [mealType]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch meal status:', err);
    } finally {
      setLoading(prev => ({ ...prev, [mealType]: false }));
    }
  };

  const handleRefreshStatus = (mealType) => {
    fetchMealStatus(mealType);
  };

  const getTimeUntilExpiry = (secondsUntilExpiry) => {
    if (!secondsUntilExpiry || secondsUntilExpiry <= 0) return 'Expired';
    
    const minutes = Math.floor(secondsUntilExpiry / 60);
    const seconds = secondsUntilExpiry % 60;
    
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="group-status-container">
      <h3>👥 Group: {group.name}</h3>
      <p className="group-info">
        Members: {group.memberCount || group.members?.length || 0} | 
        Code: <span className="join-code">{group.joinCode}</span>
      </p>

      <div className="meals-grid">
        {mealTypes.map(mealType => {
          const status = mealStatus[mealType];
          const isLoading = loading[mealType];
          const goingCount = status?.goingCount || 0;
          const timeLeft = status?.secondsUntilExpiry;
          
          return (
            <div key={mealType} className="meal-status-card">
              <div className="meal-header">
                <span className="meal-emoji">{mealEmojis[mealType]}</span>
                <span className="meal-name">{mealType}</span>
              </div>

              {status && status.goingUsers && status.goingUsers.length > 0 ? (
                <>
                  <div className="going-count">
                    <strong>{goingCount}</strong> going
                  </div>
                  <ul className="going-users">
                    {status.goingUsers.map((userId, idx) => (
                      <li key={idx}>{userId}</li>
                    ))}
                  </ul>
                  <div className="expiry-time">
                    ⏱️ {getTimeUntilExpiry(timeLeft)}
                  </div>
                </>
              ) : (
                <div className="no-going">
                  No one going yet
                </div>
              )}

              <button
                className="refresh-btn"
                onClick={() => handleRefreshStatus(mealType)}
                disabled={isLoading}
              >
                {isLoading ? '⟳ Loading...' : '⟳ Refresh'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupStatusList;
