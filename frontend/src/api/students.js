import apiClient from './client';

export const studentsApi = {
  getAll: () => apiClient.get('/students'),
  getById: (id) => apiClient.get(`/students/${id}`),
  create: (studentData) => apiClient.post('/students', studentData),
  delete: (id) => apiClient.delete(`/students/${id}`),
};

export default studentsApi;
