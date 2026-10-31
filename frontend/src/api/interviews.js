import apiClient from './client';

export const interviewsApi = {
  getAll: () => apiClient.get('/interviews'),
  getById: (id) => apiClient.get(`/interviews/${id}`),
  create: (interviewData) => apiClient.post('/interviews', interviewData),
  update: (id, interviewData) => apiClient.put(`/interviews/${id}`, interviewData),
  updateResult: (id, result) => apiClient.put(`/interviews/${id}/result`, { result }),
  delete: (id) => apiClient.delete(`/interviews/${id}`),
};

export default interviewsApi;
