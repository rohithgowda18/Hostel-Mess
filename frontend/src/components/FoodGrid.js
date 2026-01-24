import React from 'react';
import FoodCard from './FoodCard';
import { FOOD_OPTIONS } from '../data/foodData';
import './FoodGrid.css';

const FoodGrid = ({ mealType, selectedItems, onItemToggle }) => {
  const foodItems = FOOD_OPTIONS[mealType] || [];

  return (
    <div className="food-grid">
      {foodItems.map((food) => (
        <FoodCard
          key={food.name}
          name={food.name}
          image={food.image}
          isSelected={selectedItems.includes(food.name)}
          onToggle={() => onItemToggle(food.name)}
        />
      ))}
    </div>
  );
};

export default FoodGrid;
