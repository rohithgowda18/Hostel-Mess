import axios from 'axios';
import { getAuthHeader } from './authService';

// Use environment variable for API base, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_BASE 
  ? `${process.env.REACT_APP_API_BASE}`
  : 'http://localhost:8080/api';

// Create axios instance with default config
// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to inject Authorization header if available
axiosInstance.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const api = {
  /**
   * Get today's meal for a specific meal type (public endpoint)
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @returns {Promise} Response with today's meal or null
   */
  getTodayMeal: async (mealType) => {
    try {
      const response = await axiosInstance.get(`/meals/today/${mealType}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching today's ${mealType}:`, error);
      throw error;
    }
  },

  /**
   * Post/Update today's meal (requires authentication)
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string[]} items - Array of selected food items
   * @returns {Promise} Response with saved meal data
   */
  updateMeal: async (mealType, date, items) => {
    try {
      const response = await axiosInstance.post('/meals/update', {
        mealType,
        date,
        items
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating ${mealType}:`, error);
      throw error;
    }
  },

  /**
   * Create a new group (requires authentication)
   * @param {string} name - Group name
   * @returns {Promise} Response with created group
   */
  createGroup: async (name) => {
    try {
      const response = await axiosInstance.post('/groups/create', { name });
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  /**
   * Join a group using group code (requires authentication)
   * @param {string} groupCode - 8-character group code
   * @returns {Promise} Response with group details
   */
  joinGroup: async (groupCode) => {
    try {
      const response = await axiosInstance.post('/groups/join', { groupCode });
      return response.data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  },

  /**
   * Get user's groups (requires authentication)
   * @returns {Promise} Array of user's groups
   */
  getUserGroups: async () => {
    try {
      const response = await axiosInstance.get('/groups/my-groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  },

  /**
   * Get group details (requires authentication)
   * @param {string} groupId - Group ID
   * @returns {Promise} Group details
   */
  getGroupDetails: async (groupId) => {
    try {
      const response = await axiosInstance.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }
  },

  /**
   * Update group meal status - mark user as going (requires authentication)
   * @param {string} groupId - Group ID
   * @param {string} mealType - BREAKFAST, LUNCH, SNACKS, DINNER
   * @returns {Promise} Response
   */
  markMealGoing: async (groupId, mealType) => {
    try {
      const response = await axiosInstance.post(`/groups/${groupId}/meals/going`, {
        mealType
      });
      return response.data;
    } catch (error) {
      console.error('Error marking meal as going:', error);
      throw error;
    }
  },

  /**
   * Send a message to a chat (requires authentication)
   * @param {string} chatType - "GROUP" or "UNIVERSAL"
   * @param {string} chatId - Group ID for GROUP, "GLOBAL" for UNIVERSAL
   * @param {string} message - Message content
   * @returns {Promise} Response with created message
   */
  sendMessage: async (chatType, chatId, message) => {
    try {
      const response = await axiosInstance.post('/chat/send', {
        chatType,
        chatId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Get messages for a chat (requires authentication)
   * @param {string} chatType - "GROUP" or "UNIVERSAL"
   * @param {string} chatId - Group ID for GROUP, "GLOBAL" for UNIVERSAL
   * @returns {Promise} Array of chat messages
   */
  getMessages: async (chatType, chatId) => {
    try {
      const response = await axiosInstance.get('/chat/messages', {
        params: { chatType, chatId }
      });
      // The backend now returns { messages: [...], ...pagination }
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Delete a message (admin only, requires authentication)
   * @param {string} messageId - Message ID to delete
   * @returns {Promise} Response with deletion status
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await axiosInstance.delete(`/chat/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
};

export default api;
