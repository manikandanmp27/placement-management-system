package com.example.placement_management_system.repository;

import com.example.placement_management_system.dto.report.StudentInInterviewReportDTO;
import com.example.placement_management_system.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudent_StudentId(Integer studentId);

    @Query("SELECT new com.example.placement_management_system.dto.report.StudentInInterviewReportDTO(" +
           "s.studentId, s.name, s.email, d.departmentName, " +
           "j.jobId, j.jobTitle, c.companyName, " +
           "a.applicationId, a.status, " +
           "i.interviewId, i.roundNumber, i.roundType, i.interviewDate, i.result) " +
           "FROM Application a " +
           "JOIN a.student s " +
           "JOIN s.department d " +
           "JOIN a.job j " +
           "JOIN j.company c " +
           "LEFT JOIN Interview i ON i.application.applicationId = a.applicationId AND (i.result IS NULL OR LOWER(i.result) = 'pending') " +
           "WHERE a.status NOT IN ('SELECTED', 'REJECTED') " +
           "AND (a.status = 'SHORTLISTED' OR (i.interviewId IS NOT NULL AND LOWER(i.result) = 'pending')) " +
           "ORDER BY a.applicationId DESC, i.roundNumber ASC")
    List<StudentInInterviewReportDTO> findStudentsInInterviewProcess();

    @Query("SELECT COUNT(DISTINCT a.applicationId) " +
           "FROM Application a " +
           "LEFT JOIN Interview i ON i.application.applicationId = a.applicationId AND (i.result IS NULL OR LOWER(i.result) = 'pending') " +
           "WHERE a.status NOT IN ('SELECTED', 'REJECTED') " +
           "AND (a.status = 'SHORTLISTED' OR (i.interviewId IS NOT NULL AND LOWER(i.result) = 'pending'))")
    long countActiveInterviewPipelineApplications();
}