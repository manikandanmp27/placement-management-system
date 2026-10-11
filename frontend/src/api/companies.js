import apiClient from './client';

export const companiesApi = {
  getAll: () => apiClient.get('/companies'),
  getById: (id) => apiClient.get(`/companies/${id}`),
  create: (companyData) => apiClient.post('/companies', companyData),
  delete: (id) => apiClient.delete(`/companies/${id}`),
};

export default companiesApi;
