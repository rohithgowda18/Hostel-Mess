import React from 'react';
import { getMealEmoji, getMealDisplayName } from '../data/foodData';
import './TodayMenuDisplay.css';

const TodayMenuDisplay = ({ mealType, menuData, loading }) => {
  const formatPostedTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="today-menu-card">
      <h2>
        {getMealEmoji(mealType)} Today's {getMealDisplayName(mealType)} Menu
      </h2>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading menu...</p>
        </div>
      ) : menuData && menuData.items && menuData.items.length > 0 ? (
        <div className="menu-display">
          <div className="menu-items">
            {menuData.items.map((item, index) => (
              <span key={index} className="menu-item">
                {item}
              </span>
            ))}
          </div>
          <p className="posted-time">
            Posted at {formatPostedTime(menuData.postedAt)}
          </p>
        </div>
      ) : menuData && menuData.error ? (
        <div className="menu-display">
          <div className="no-menu">
            <div className="emoji">⚠️</div>
            <p>Mess data unavailable. Showing default menu.</p>
          </div>
        </div>
      ) : (
        <div className="menu-display">
          <div className="no-menu">
            <div className="emoji">🤷</div>
            <p>Menu not updated yet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayMenuDisplay;
