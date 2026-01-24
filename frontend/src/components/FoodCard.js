import React, { useState } from 'react';
import './FoodCard.css';

const FoodCard = ({ name, image, isSelected, onToggle }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={`food-card ${isSelected ? 'selected' : ''}`}
      onClick={onToggle}
    >
      <div className="food-image-container">
        {!imageError ? (
          <img
            src={image}
            alt={name}
            className="food-image"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="food-image-placeholder">
            <span>🍽️</span>
          </div>
        )}
        {isSelected && (
          <div className="selected-overlay">
            <span className="checkmark">✓</span>
          </div>
        )}
      </div>
      <div className="food-name">{name}</div>
    </div>
  );
};

export default FoodCard;
