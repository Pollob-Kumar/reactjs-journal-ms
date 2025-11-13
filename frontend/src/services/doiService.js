// frontend/src/services/doiService.js

import api from './api';

const doiService = {
  // Get all DOI deposits
  getDeposits: async (params = {}) => {
    const response = await api.get('/admin/doi/deposits', { params });
    return response.data;
  },

  // Get deposit details
  getDepositDetails: async (manuscriptId) => {
    const response = await api.get(`/admin/doi/deposits/${manuscriptId}`);
    return response.data;
  },

  // Retry DOI deposit
  retryDeposit: async (manuscriptId) => {
    const response = await api.post(`/admin/doi/deposits/${manuscriptId}/retry`);
    return response.data;
  },

  // Manually assign DOI
  assignDoi: async (manuscriptId, doi) => {
    const response = await api.post(`/admin/doi/deposits/${manuscriptId}/assign`, { doi });
    return response.data;
  },

  // Bulk retry failed deposits
  bulkRetry: async () => {
    const response = await api.post('/admin/doi/deposits/bulk-retry');
    return response.data;
  }
};

export default doiService;
