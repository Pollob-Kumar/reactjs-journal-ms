import api from './api';

const reviewService = {
  // Assign reviewers
  assignReviewers: async (manuscriptId, reviewerIds) => {
    const response = await api.post(`/reviews/manuscripts/${manuscriptId}/assign`, {
      reviewerIds
    });
    return response.data;
  },

  // Get manuscript reviews
  getManuscriptReviews: async (manuscriptId) => {
    const response = await api.get(`/reviews/manuscripts/${manuscriptId}`);
    return response.data;
  },

  // Get my reviews
  getMyReviews: async (params = {}) => {
    const response = await api.get('/reviews/my-reviews', { params });
    return response.data;
  },

  // Get single review
  getReview: async (id) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (id) => {
    const response = await api.put(`/reviews/${id}/accept`);
    return response.data;
  },

  // Decline invitation
  declineInvitation: async (id, reason) => {
    const response = await api.put(`/reviews/${id}/decline`, { reason });
    return response.data;
  },

  // Submit review
  submitReview: async (id, reviewData) => {
    const response = await api.put(`/reviews/${id}/submit`, reviewData);
    return response.data;
  },

  // Send reminder
  sendReminder: async (id) => {
    const response = await api.post(`/reviews/${id}/remind`);
    return response.data;
  }
};

export default reviewService;