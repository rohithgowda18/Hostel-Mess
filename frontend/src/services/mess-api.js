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

  async submitMealConsensus(mealType, date, items, photoUrl) {
    const response = await apiClient.post('/meals/submit-consensus', { mealType, date, items, photoUrl });
    return response.data;
  },

  async getMealConsensus(mealType, date) {
    const response = await apiClient.get(`/meals/consensus/${mealType}/${date}`);
    return response.data;
  },

  async getProfileStats() {
    const response = await apiClient.get('/users/profile-stats');
    return response.data;
  },

  async getLeaderboard() {
    const response = await apiClient.get('/users/leaderboard');
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

  async leaveGroup(groupId) {
    const response = await apiClient.delete(`/groups/${groupId}/leave`);
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

  async getMyReports() {
    return [];
  },

  async getMyProfile() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  async updateMyProfile(payload) {
    const response = await apiClient.put('/users/me', payload);
    return response.data;
  },

  // Student Photos API
  async getStudentPhotosToday() {
    const response = await apiClient.get('/student-photos/today');
    return response.data;
  },

  async uploadStudentPhoto(formData) {
    const response = await apiClient.post('/student-photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Notifications API
  async getNotifications() {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  async getUnreadNotificationCount() {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },
  async markNotificationAsRead(id) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
  async markAllNotificationsAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },
  async deleteNotification(id) {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  // Ratings API
  async submitMealRating(rating) {
    const response = await apiClient.post('/ratings', rating);
    return response.data;
  },
  async getMealRatingsSummary(mealType, date) {
    const response = await apiClient.get(`/ratings/${mealType}/${date}`);
    return response.data;
  },
  async getMyMealRating(mealType, date) {
    const response = await apiClient.get(`/ratings/my-rating/${mealType}/${date}`);
    return response.data;
  },

  // Search API
  async searchUniversal(q) {
    const response = await apiClient.get('/search', { params: { q } });
    return response.data;
  },

  // Analytics API
  async getAnalytics() {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  // Attendance API
  async setExpectedAttendance(mealType, date, expected) {
    const response = await apiClient.post('/attendance/expected', { mealType, date, expected });
    return response.data;
  },
  async getMyAttendanceStatus(mealType, date) {
    const response = await apiClient.get('/attendance/my-status', { params: { mealType, date } });
    return response.data;
  },
  async checkInQR(mealType, date, code) {
    const response = await apiClient.post('/attendance/check-in', { mealType, date, code });
    return response.data;
  },
  async getAttendanceStats(date) {
    const response = await apiClient.get('/attendance/stats', { params: { date } });
    return response.data;
  },

  // Announcements API
  async getAnnouncements() {
    const response = await apiClient.get('/announcements');
    return response.data;
  },
  async createAnnouncement(announcement) {
    const response = await apiClient.post('/announcements', announcement);
    return response.data;
  },

  // Weekly Menu API
  async getWeeklyMenu(weekStartDate) {
    try {
      const response = await apiClient.get('/weekly-menu', { params: { weekStartDate } });
      return response.data;
    } catch {
      return [];
    }
  },
  async saveWeeklyMenu(weeklyMenu) {
    const response = await apiClient.post('/weekly-menu', weeklyMenu);
    return response.data;
  },

  // Favorites API
  async getFavorites() {
    const response = await apiClient.get('/favorites');
    return response.data;
  },
  async saveFavorites(items) {
    const response = await apiClient.post('/favorites', items);
    return response.data;
  },

  // Directory & Room Occupancy APIs
  async getDirectoryTree() {
    const response = await apiClient.get('/directory');
    return response.data;
  },
  async getRoomDetails(roomId) {
    const response = await apiClient.get(`/directory/room/${roomId}`);
    return response.data;
  },
  async searchDirectory(params) {
    const response = await apiClient.get('/directory/search', { params });
    return response.data;
  },
  async updateDirectoryVisibility(visible) {
    const response = await apiClient.put('/directory/visibility', null, { params: { visible } });
    return response.data;
  },
  async getOccupancyStats() {
    try {
      const response = await apiClient.get('/analytics/occupancy');
      return response.data;
    } catch {
      return { occupancyPercentage: 68, statusLabel: 'Moderate' };
    }
  },
  async addRoom(room) {
    const response = await apiClient.post('/admin/rooms', room);
    return response.data;
  },
  async assignStudentToRoom(roomId, studentId) {
    const response = await apiClient.put(`/admin/rooms/${roomId}/assign`, null, { params: { studentId } });
    return response.data;
  },
  async vacateRoom(roomId) {
    const response = await apiClient.delete(`/admin/rooms/${roomId}/vacate`);
    return response.data;
  },
  async getAdminStudents(query) {
    const response = await apiClient.get('/admin/students', { params: { query } });
    return response.data;
  },
  async downloadOccupancyReport() {
    const response = await apiClient.get('/admin/occupancy-report', { responseType: 'blob' });
    return response.data;
  }
};
