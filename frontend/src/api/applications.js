import apiClient from './client';

export const applicationsApi = {
  getAll: () => apiClient.get('/applications'),
  getById: (id) => apiClient.get(`/applications/${id}`),
  create: (applicationData) => apiClient.post('/applications', applicationData),
  delete: (id) => apiClient.delete(`/applications/${id}`),
};

export default applicationsApi;
