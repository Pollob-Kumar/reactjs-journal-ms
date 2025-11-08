import api from './api';

const issueService = {
  // Create issue
  createIssue: async (issueData) => {
    const response = await api.post('/issues', issueData);
    return response.data;
  },

  // Get all issues
  getIssues: async (params = {}) => {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  // Get single issue
  getIssue: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  // Add manuscript to issue
  addManuscript: async (id, manuscriptData) => {
    const response = await api.put(`/issues/${id}/manuscripts`, manuscriptData);
    return response.data;
  },

  // Remove manuscript from issue
  removeManuscript: async (issueId, manuscriptId) => {
    const response = await api.delete(`/issues/${issueId}/manuscripts/${manuscriptId}`);
    return response.data;
  },

  // Publish issue
  publishIssue: async (id) => {
    const response = await api.put(`/issues/${id}/publish`);
    return response.data;
  },

  // Update issue
  updateIssue: async (id, updates) => {
    const response = await api.put(`/issues/${id}`, updates);
    return response.data;
  },

  // Delete issue
  deleteIssue: async (id) => {
    const response = await api.delete(`/issues/${id}`);
    return response.data;
  }
};

export default issueService;