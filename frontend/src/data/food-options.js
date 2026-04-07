export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export const FOOD_OPTIONS = {
  BREAKFAST: [],
  LUNCH: [],
  SNACKS: [],
  DINNER: []
};

export const COMMON_FOODS = {
  BREAKFAST: ['Idli', 'Dosa', 'Upma', 'Pongal', 'Bread & Jam', 'Paratha', 'Poha', 'Uttapam', 'Poori', 'Vada', 'Oats', 'Cereal'],
  LUNCH: ['Rice', 'Sambar', 'Rasam', 'Dal', 'Chapati', 'Veg Curry', 'Rajma', 'Chole', 'Curd', 'Papad', 'Biryani', 'Pulao'],
  SNACKS: ['Tea', 'Coffee', 'Samosa', 'Vada', 'Biscuits', 'Bread Pakora', 'Maggi', 'Cutlet', 'Banana', 'Cake', 'Cookies', 'Namkeen'],
  DINNER: ['Chapati', 'Rice', 'Dal', 'Veg Curry', 'Paneer Curry', 'Egg Curry', 'Chicken Curry', 'Rasam', 'Curd', 'Sabzi', 'Fry', 'Pickle']
};

export const getMealDisplayName = (mealType) => {
  const map = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    SNACKS: 'Evening Snacks',
    DINNER: 'Dinner'
  };
  return map[mealType] || mealType;
};

export const getFoodImageUrl = (foodName) => {
  const query = encodeURIComponent(`${foodName} indian food`);
  return `https://source.unsplash.com/320x220/?${query}`;
};
