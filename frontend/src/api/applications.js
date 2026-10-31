import apiClient from './client';

export const applicationsApi = {
  getAll: () => apiClient.get('/applications'),
  getById: (id) => apiClient.get(`/applications/${id}`),
  create: (applicationData) => apiClient.post('/applications', applicationData),
  update: (id, applicationData) => apiClient.put(`/applications/${id}`, applicationData),
  updateStatus: (id, status) => apiClient.put(`/applications/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/applications/${id}`),
};

export default applicationsApi;
