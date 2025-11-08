import api from './api';

const userService = {
  // Get user profile
  getUserProfile: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Get reviewers
  getReviewers: async (params = {}) => {
    const response = await api.get('/users/reviewers', { params });
    return response.data;
  },

  // Get editors
  getEditors: async () => {
    const response = await api.get('/users/editors');
    return response.data;
  },

  // Get user statistics
  getUserStats: async (id) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  }
};

export default userService;