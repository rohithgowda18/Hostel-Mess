import apiClient from '@/services/api-client';

export const messApi = {
  // Meal APIs
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

  // Group APIs with pagination
  async createGroup(name) {
    const response = await apiClient.post('/groups/create', { name });
    return response.data;
  },

  async joinGroup(groupCode) {
    const response = await apiClient.post('/groups/join', { groupCode });
    return response.data;
  },

  async getUserGroups(page = 0, size = 20) {
    const response = await apiClient.get('/groups/my-groups', {
      params: { page, size }
    });
    return response.data; // Returns PaginatedResponse
  },

  async getAllGroups(page = 0, size = 20) {
    const response = await apiClient.get('/groups/all', {
      params: { page, size }
    });
    return response.data; // Returns PaginatedResponse
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

  // Chat APIs with pagination
  async getMessagesPaginated(chatType, chatId, page = 0, size = 20) {
    const response = await apiClient.get('/chat/messages', {
      params: { chatType, chatId, page, size }
    });
    return response.data; // Returns PaginatedResponse<ChatResponse>
  },

  // Deprecated: kept for backwards compatibility
  async getMessages(chatType, chatId, page = 0, size = 50) {
    const response = await apiClient.get('/chat/messages', {
      params: { chatType, chatId, page, size }
    });
    return response.data.data || [];
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

  // Complaint APIs with pagination
  async getComplaintsTodayPaginated(mealType, page = 0, size = 20) {
    const response = await apiClient.get(`/complaints/today/${mealType}`, {
      params: { page, size }
    });
    return response.data; // Returns PaginatedResponse<ComplaintResponse>
  },

  // Deprecated: kept for backwards compatibility
  async getComplaintsToday(mealType) {
    const response = await apiClient.get(`/complaints/today/${mealType}`);
    return response.data.data || [];
  },

  async getAllComplaintsByMeal(mealTypes, page = 0, size = 20) {
    const results = await Promise.all(
      mealTypes.map(async (mealType) => {
        try {
          const data = await this.getComplaintsTodayPaginated(mealType, page, size);
          return [mealType, data.data || []];
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

  async getComplaintStatsPaginated(status, page = 0, size = 20) {
    const response = await apiClient.get(`/complaints/admin/status/${status}`, {
      params: { page, size }
    });
    return response.data; // Returns PaginatedResponse<ComplaintResponse>
  },

  async getAllComplaintsPaginated(page = 0, size = 20) {
    const response = await apiClient.get('/complaints/admin/all', {
      params: { page, size }
    });
    return response.data; // Returns PaginatedResponse<ComplaintResponse>
  },

  async getComplaintStats() {
    const response = await apiClient.get('/complaints/admin/stats');
    return response.data;
  },

  // User APIs
  async getMyProfile() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  async updateMyProfile(payload) {
    const response = await apiClient.put('/users/me', payload);
    return response.data;
  }
};
