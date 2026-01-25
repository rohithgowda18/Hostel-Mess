import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance for complaints
const complaintAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

const complaintApi = {
  /**
   * Raise a complaint against a food item
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @param {string} foodItem - Food item name
   * @param {array} reasons - Array of reason strings
   * @param {string} comment - Optional comment (max 100 chars)
   */
  raiseComplaint: (mealType, foodItem, reasons, comment) => {
    return complaintAxios.post('/complaints', {
      mealType,
      foodItem,
      reasons,
      comment
    });
  },

  /**
   * Get all complaints for a specific meal type today
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   */
  getComplaintsToday: (mealType) => {
    return complaintAxios.get(`/complaints/today/${mealType}`);
  },

  /**
   * Vote on a complaint
   * @param {string} complaintId - ID of the complaint
   * @param {string} vote - 'AGREE' or 'DISAGREE'
   * @param {string} userId - Unique identifier for the user voting
   */
  voteOnComplaint: (complaintId, vote, userId) => {
    return complaintAxios.post('/complaints/vote', {
      complaintId,
      vote,
      userId
    });
  }
};

export default complaintApi;
