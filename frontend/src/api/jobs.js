import apiClient from './client';

export const jobsApi = {
  getAll: () => apiClient.get('/jobs'),
  getById: (id) => apiClient.get(`/jobs/${id}`),
  create: (jobData) => apiClient.post('/jobs', jobData),
  delete: (id) => apiClient.delete(`/jobs/${id}`),
};

export default jobsApi;
