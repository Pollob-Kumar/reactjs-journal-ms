import api from './api';

const manuscriptService = {
  // Submit new manuscript
  submitManuscript: async (formData) => {
    const response = await api.post('/manuscripts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get all manuscripts
  getManuscripts: async (params = {}) => {
    const response = await api.get('/manuscripts', { params });
    return response.data;
  },

  // Get single manuscript
  getManuscript: async (id) => {
    const response = await api.get(`/manuscripts/${id}`);
    return response.data;
  },

  // Submit revision
  submitRevision: async (id, formData) => {
    const response = await api.put(`/manuscripts/${id}/revise`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Assign editor
  assignEditor: async (id, editorId) => {
    const response = await api.put(`/manuscripts/${id}/assign-editor`, { editorId });
    return response.data;
  },

  // Make editorial decision
  makeDecision: async (id, decision, comments) => {
    const response = await api.put(`/manuscripts/${id}/decision`, { decision, comments });
    return response.data;
  },

  // Delete manuscript
  deleteManuscript: async (id) => {
    const response = await api.delete(`/manuscripts/${id}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/manuscripts/stats');
    return response.data;
  },

  // Download file
  downloadFile: async (fileId) => {
    const response = await api.get(`/files/${fileId}`, {
      responseType: 'blob'
    });
    return response;
  }
};

export default manuscriptService;