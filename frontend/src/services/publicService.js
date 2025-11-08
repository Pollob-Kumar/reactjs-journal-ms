import api from './api';

const publicService = {
  // Search articles
  searchArticles: async (params = {}) => {
    const response = await api.get('/public/search', { params });
    return response.data;
  },

  // Get current issue
  getCurrentIssue: async () => {
    const response = await api.get('/public/current-issue');
    return response.data;
  },

  // Get archives
  getArchives: async (params = {}) => {
    const response = await api.get('/public/archives', { params });
    return response.data;
  },

  // Get article
  getArticle: async (manuscriptId) => {
    const response = await api.get(`/public/articles/${manuscriptId}`);
    return response.data;
  },

  // Get public stats
  getPublicStats: async () => {
    const response = await api.get('/public/stats');
    return response.data;
  },

  // Download article
  downloadArticle: async (manuscriptId) => {
    const response = await api.get(`/public/articles/${manuscriptId}/download`, {
      responseType: 'blob'
    });
    return response;
  }
};

export default publicService;