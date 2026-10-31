import apiClient from './client';

export const officersApi = {
  getAll: () => apiClient.get('/admin/officers'),
  getById: (id) => apiClient.get(`/admin/officers/${id}`),
  create: (officerData) => apiClient.post('/admin/officers', officerData),
  updateStatus: (id, enabled) => apiClient.put(`/admin/officers/${id}/status`, { enabled }),
  resetPassword: (id, newPassword) => apiClient.put(`/admin/officers/${id}/reset-password`, { newPassword }),
};

export default officersApi;
