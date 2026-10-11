import apiClient from './client';

export const interviewsApi = {
  getAll: () => apiClient.get('/interviews'),
  getById: (id) => apiClient.get(`/interviews/${id}`),
  create: (interviewData) => apiClient.post('/interviews', interviewData),
  delete: (id) => apiClient.delete(`/interviews/${id}`),
};

export default interviewsApi;
