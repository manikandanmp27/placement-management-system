import apiClient from './client';

export const studentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.includeArchived) query.append('includeArchived', 'true');
    if (params.archived !== undefined) query.append('archived', String(params.archived));
    const qs = query.toString();
    return apiClient.get(`/students${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiClient.get(`/students/${id}`),
  create: (studentData) => apiClient.post('/students', studentData),
  update: (id, studentData) => apiClient.put(`/students/${id}`, studentData),
  delete: (id) => apiClient.delete(`/students/${id}`),
  archive: (id) => apiClient.put(`/students/${id}/archive`),
  unarchive: (id) => apiClient.put(`/students/${id}/unarchive`),
};

export default studentsApi;
