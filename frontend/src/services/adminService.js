import api from './api';

const adminService = {
  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, updates) => {
    const response = await api.put(`/admin/users/${id}`, updates);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Get system statistics
  getSystemStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  // Get all manuscripts
  getAllManuscripts: async (params = {}) => {
    const response = await api.get('/admin/manuscripts', { params });
    return response.data;
  },

  // Delete manuscript
  deleteManuscript: async (id) => {
    const response = await api.delete(`/admin/manuscripts/${id}`);
    return response.data;
  }
};

export default adminService;