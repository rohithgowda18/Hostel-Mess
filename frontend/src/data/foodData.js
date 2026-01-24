// Food data configuration with images (using placeholder images from public APIs)
export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

export const FOOD_OPTIONS = {
  BREAKFAST: [
    { name: 'Idli', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&h=200&fit=crop' },
    { name: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&h=200&fit=crop' },
    { name: 'Poori', image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=200&h=200&fit=crop' },
    { name: 'Upma', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&h=200&fit=crop' },
    { name: 'Pongal', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&h=200&fit=crop' },
    { name: 'Bread & Jam', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop' },
    { name: 'Rice Bath', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=200&h=200&fit=crop' },
    { name: 'Vada', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=200&h=200&fit=crop' },
  ],
  LUNCH: [
    { name: 'Rice', image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&h=200&fit=crop' },
    { name: 'Sambar', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
    { name: 'Rasam', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop' },
    { name: 'Chapati', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop' },
    { name: 'Vegetable Curry', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=200&h=200&fit=crop' },
    { name: 'Curd', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
    { name: 'Pickle', image: 'https://images.unsplash.com/photo-1589135716294-6b11e4e1f9e6?w=200&h=200&fit=crop' },
    { name: 'Sweet', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop' },
  ],
  SNACKS: [
    { name: 'Tea', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop' },
    { name: 'Coffee', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop' },
    { name: 'Samosa', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop' },
    { name: 'Bajji', image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&h=200&fit=crop' },
    { name: 'Bonda', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=200&h=200&fit=crop' },
    { name: 'Biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop' },
    { name: 'Puff', image: 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=200&h=200&fit=crop' },
  ],
  DINNER: [
    { name: 'Chapati', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop' },
    { name: 'Rice', image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=200&h=200&fit=crop' },
    { name: 'Dal', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=200&fit=crop' },
    { name: 'Curry', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=200&h=200&fit=crop' },
    { name: 'Curd', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop' },
    { name: 'Buttermilk', image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=200&h=200&fit=crop' },
  ],
};

export const getMealEmoji = (mealType) => {
  switch (mealType) {
    case 'BREAKFAST': return '🍳';
    case 'LUNCH': return '🍛';
    case 'SNACKS': return '☕';
    case 'DINNER': return '🍽️';
    default: return '🍴';
  }
};

export const getMealDisplayName = (mealType) => {
  switch (mealType) {
    case 'BREAKFAST': return 'Breakfast';
    case 'LUNCH': return 'Lunch';
    case 'SNACKS': return 'Evening Snacks';
    case 'DINNER': return 'Dinner';
    default: return mealType;
  }
};
