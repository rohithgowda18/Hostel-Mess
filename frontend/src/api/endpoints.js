export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  },
  MEALS: {
    TODAY: '/meals/today',
    ACTIVE_SLOT: '/meals/active-slot',
    REPORT: '/meals/report',
    SUBMIT_CONSENSUS: '/meals/submit-consensus',
    VERIFY: '/meals/verify',
    HISTORY: '/meals/history',
    WEEKLY_MENU: '/weekly-menu',
    SERVICES_CURRENT: '/meal-services/current',
    SERVICES_TODAY: '/meal-services/today',
    SERVICES_STATUS: (id) => `/meal-services/${id}/status`,
    PHOTOS_UPLOAD: '/student-photos/upload',
    PHOTOS_TODAY: '/student-photos/today',
    PHOTOS_IMAGE: (id) => `/student-photos/${id}/image`,
    FAVORITES: '/favorites'
  },
  ATTENDANCE: {
    INTENT: '/attendance/intent',
    PASS: '/attendance/pass',
    CHECK_IN: '/attendance/check-in',
    HISTORY: '/attendance/history',
    MY_STATUS: '/attendance/my-status',
    QR_CODE: '/attendance/qr-code',
    STATS: '/attendance/stats',
    ROSTER: '/attendance/roster'
  },
  COMMUNITY: {
    RATINGS: '/ratings',
    RATINGS_SUMMARY: (mealType, date) => `/ratings/${mealType}/${date}`,
    MY_RATING: (mealType, date) => `/ratings/my-rating/${mealType}/${date}`,
    COMPLAINTS: '/complaints',
    COMPLAINT_DETAIL: (id) => `/complaints/${id}`,
    COMPLAINT_VOTE: (id) => `/complaints/${id}/vote`,
    COMPLAINT_STATUS: (id) => `/complaints/${id}/status`,
    COMPLAINT_STATS: '/complaints/admin/stats',
    GROUPS: '/groups',
    MY_GROUPS: '/groups/my-groups',
    GROUP_DETAIL: (id) => `/groups/${id}`,
    GROUP_LEAVE: (id) => `/groups/${id}/leave`,
    GROUP_JOIN: '/groups/join',
    GROUP_BY_CODE: (code) => `/groups/code/${code}`,
    GROUP_MEAL_STATUS: '/group-meal-status',
    GROUP_MEAL_STATUS_GET: (groupId, mealType) => `/group-meal-status/${groupId}/${mealType}`,
    CHAT_MESSAGES: '/chat/messages',
    CHAT_MESSAGE_DELETE: (id) => `/chat/messages/${id}`
  },
  USER: {
    ME: '/users/me',
    PROFILE: (id) => `/users/${id}`,
    FAVORITES: '/users/favorites',
    MY_REPORTS: '/users/my-reports',
    PROFILE_STATS: '/users/profile-stats',
    LEADERBOARD: '/users/leaderboard',
    SEARCH: '/search'
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    USER_ROLE: (id) => `/admin/users/${id}/role`,
    RATINGS: '/admin/ratings',
    COMPLAINTS: '/admin/complaints',
    ANALYTICS_DASHBOARD: '/analytics/dashboard',
    ANALYTICS_OCCUPANCY: '/analytics/occupancy',
    ANALYTICS_FORECAST: '/analytics/kitchen-forecast',
    ANALYTICS_EXPORT: '/analytics/export'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
    ANNOUNCEMENTS: '/announcements'
  }
};
