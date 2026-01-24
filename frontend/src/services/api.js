import axios from 'axios';

// Use environment variable for API base, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_BASE 
  ? `${process.env.REACT_APP_API_BASE}/meals`
  : 'http://localhost:8080/api/meals';

const api = {
  /**
   * Get today's meal for a specific meal type
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @returns {Promise} Response with today's meal or null
   */
  getTodayMeal: async (mealType) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/today/${mealType}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching today's ${mealType}:`, error);
      throw error;
    }
  },

  /**
   * Post/Update today's meal
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string[]} items - Array of selected food items
   * @returns {Promise} Response with saved meal data
   */
  updateMeal: async (mealType, date, items) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/update`, {
        mealType,
        date,
        items
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating ${mealType}:`, error);
      throw error;
    }
  }
};

export default api;
