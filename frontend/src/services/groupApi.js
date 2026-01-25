import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:8080/api';

// Create axios instance without auth
const axiosWithAuth = axios.create({
  baseURL: API_BASE_URL,
});

const groupApi = {
  /**
   * Create a new group (requires authentication - userId from JWT)
   */
  createGroup: (name) => {
    return axiosWithAuth.post('/groups/create', { name });
  },

  /**
   * Join a group using 8-character group code (requires authentication)
   */
  joinGroup: (groupCode) => {
    return axiosWithAuth.post('/groups/join', { groupCode });
  },

  /**
   * Get all groups for authenticated user
   */
  getUserGroups: () => {
    return axiosWithAuth.get('/groups/my-groups');
  },

  /**
   * Get group details
   */
  getGroupDetails: (groupId) => {
    return axiosWithAuth.get(`/groups/${groupId}`);
  },

  /**
   * Mark user as going to a meal
   */
  markUserGoing: (groupId, mealType) => {
    return axiosWithAuth.post(`/group-meal-status/going`, {
      groupId,
      mealType
    });
  },

  /**
   * Cancel user's going status
   */
  cancelUserGoing: (groupId, mealType) => {
    return axiosWithAuth.delete(`/group-meal-status/${groupId}/${mealType}`);
  },

  /**
   * Get group meal status
   */
  getGroupMealStatus: (groupId, mealType) => {
    return axiosWithAuth.get(`/group-meal-status/${groupId}/${mealType}`);
  }
};

export default groupApi;
