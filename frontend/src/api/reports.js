import apiClient from './client';

export const reportsApi = {
  getUnappliedStudents: (includeArchived = false) =>
    apiClient.get('/reports/unapplied-students', { params: { includeArchived } }),
  getJobsByApplicants: () => apiClient.get('/reports/jobs-by-applicants'),
  getStudentsInInterviewProcess: () => apiClient.get('/reports/students-in-interview-process'),
  getSummary: () => apiClient.get('/reports/summary'),
};

export default reportsApi;
