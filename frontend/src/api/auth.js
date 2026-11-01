import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  demoLogin: (role) => apiClient.post('/auth/demo-login', { role }),
  registerStudent: (data) => apiClient.post('/auth/register-student', data),
  getProfile: () => apiClient.get('/auth/me'),
};

export default authApi;

