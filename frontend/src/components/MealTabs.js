import React from 'react';
import { MEAL_TYPES, getMealEmoji, getMealDisplayName } from '../data/foodData';
import './MealTabs.css';

const MealTabs = ({ activeMeal, onMealChange }) => {
  return (
    <div className="meal-tabs">
      {MEAL_TYPES.map((meal) => (
        <button
          key={meal}
          className={`meal-tab ${activeMeal === meal ? 'active' : ''}`}
          onClick={() => onMealChange(meal)}
        >
          <span className="meal-emoji">{getMealEmoji(meal)}</span>
          <span className="meal-name">{getMealDisplayName(meal)}</span>
        </button>
      ))}
    </div>
  );
};

export default MealTabs;
