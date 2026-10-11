import apiClient from './client';

export const placementsApi = {
  getAll: () => apiClient.get('/placements'),
  getById: (id) => apiClient.get(`/placements/${id}`),
  create: (placementData) => apiClient.post('/placements', placementData),
  delete: (id) => apiClient.delete(`/placements/${id}`),
};

export default placementsApi;
