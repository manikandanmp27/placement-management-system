import apiClient from './client';

export const departmentsApi = {
  getAll: () => apiClient.get('/departments'),
  getById: (id) => apiClient.get(`/departments/${id}`),
  create: (departmentData) => apiClient.post('/departments', departmentData),
  update: (id, departmentData) => apiClient.put(`/departments/${id}`, departmentData),
  delete: (id) => apiClient.delete(`/departments/${id}`),
};


export default departmentsApi;
