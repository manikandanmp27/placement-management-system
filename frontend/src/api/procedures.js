import apiClient from './client';

export const proceduresApi = {
  
  applyForJob: (studentId, jobId) => {
    return apiClient.post('/procedures/apply', null, { studentId, jobId });
  },

  getPlacementStatistics: async (departmentId) => {
    const rawData = await apiClient.get('/procedures/placement-statistics', { departmentId });
    
    if (Array.isArray(rawData) && rawData.length > 0) {
      const firstRow = rawData[0];
      if (Array.isArray(firstRow)) {
        return {
          raw: rawData,
          departmentName: firstRow[0] || 'Unknown Department',
          totalStudents: Number(firstRow[1]) || 0,
          studentsPlaced: Number(firstRow[2]) || 0,
          placementPercentage: Number(firstRow[3]) || 0,
        };
      }
      
      return {
        raw: rawData,
        departmentName: firstRow.departmentName || firstRow[0] || '',
        totalStudents: Number(firstRow.totalStudents || firstRow[1]) || 0,
        studentsPlaced: Number(firstRow.studentsPlaced || firstRow[2]) || 0,
        placementPercentage: Number(firstRow.placementPercentage || firstRow[3]) || 0,
      };
    }
    
    return {
      raw: rawData,
      departmentName: '',
      totalStudents: 0,
      studentsPlaced: 0,
      placementPercentage: 0,
    };
  },
};

export default proceduresApi;
