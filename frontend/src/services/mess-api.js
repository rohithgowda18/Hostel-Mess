import apiClient from '@/services/api-client';

export const messApi = {
  async getTodayMeal(mealType) {
    const response = await apiClient.get(`/meals/today/${mealType}`);
    return response.data;
  },

  async updateMeal(mealType, date, items) {
    const response = await apiClient.post('/meals/update', { mealType, date, items });
    return response.data;
  },

  async getAllTodayMeals(mealTypes) {
    const results = await Promise.all(
      mealTypes.map(async (mealType) => {
        try {
          const data = await this.getTodayMeal(mealType);
          return [mealType, data];
        } catch (error) {
          return [mealType, null];
        }
      })
    );

    return Object.fromEntries(results);
  },

  async createGroup(name) {
    const response = await apiClient.post('/groups/create', { name });
    return response.data;
  },

  async joinGroup(groupCode) {
    const response = await apiClient.post('/groups/join', { groupCode });
    return response.data;
  },

  async getUserGroups() {
    const response = await apiClient.get('/groups/my-groups');
    return response.data;
  },

  async getGroupDetails(groupId) {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data;
  },

  async markGroupMealGoing(groupId, mealType, userId) {
    const response = await apiClient.post('/group-meal-status/going', { groupId, mealType });
    return response.data;
  },

  async cancelGroupMealGoing(groupId, mealType, userId) {
    const response = await apiClient.delete(`/group-meal-status/${groupId}/${mealType}`);
    return response.data;
  },

  async getGroupMealStatus(groupId, mealType) {
    const response = await apiClient.get(`/group-meal-status/${groupId}/${mealType}`);
    return response.data;
  },

  async getMessages(chatType, chatId, page = 0, size = 50) {
    const response = await apiClient.get('/chat/messages', {
      params: { chatType, chatId, page, size }
    });
    return response.data.messages || [];
  },

  async sendMessage(chatType, chatId, message) {
    const response = await apiClient.post('/chat/send', {
      chatType,
      chatId,
      message
    });
    return response.data;
  },

  async deleteMessage(messageId) {
    const response = await apiClient.delete(`/chat/${messageId}`);
    return response.data;
  },

  async getComplaintsToday(mealType) {
    const response = await apiClient.get(`/complaints/today/${mealType}`);
    return response.data;
  },

  async getAllComplaintsByMeal(mealTypes) {
    const results = await Promise.all(
      mealTypes.map(async (mealType) => {
        try {
          const data = await this.getComplaintsToday(mealType);
          return [mealType, data || []];
        } catch (error) {
          return [mealType, []];
        }
      })
    );

    return Object.fromEntries(results);
  },

  async raiseComplaint(payload) {
    const response = await apiClient.post('/complaints', payload);
    return response.data;
  },

  async voteOnComplaint(complaintId, vote) {
    const response = await apiClient.post('/complaints/vote', {
      complaintId,
      vote
    });
    return response.data;
  },

  async getComplaintStats() {
    const response = await apiClient.get('/complaints/admin/stats');
    return response.data;
  },

  async getMyProfile() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  async updateMyProfile(payload) {
    const response = await apiClient.put('/users/me', payload);
    return response.data;
  }
};
