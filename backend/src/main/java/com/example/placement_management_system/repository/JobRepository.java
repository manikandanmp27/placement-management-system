package com.example.placement_management_system.repository;

import com.example.placement_management_system.dto.report.JobApplicantCountReportDTO;
import com.example.placement_management_system.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Integer> {

    @Query("SELECT new com.example.placement_management_system.dto.report.JobApplicantCountReportDTO(" +
           "j.jobId, j.jobTitle, c.companyName, j.jobType, j.packageAmount, j.deadline, j.minCgpa, j.maxBacklogs, COUNT(a.applicationId)) " +
           "FROM Job j " +
           "JOIN j.company c " +
           "LEFT JOIN Application a ON a.job.jobId = j.jobId " +
           "GROUP BY j.jobId, j.jobTitle, c.companyName, j.jobType, j.packageAmount, j.deadline, j.minCgpa, j.maxBacklogs " +
           "ORDER BY COUNT(a.applicationId) DESC, j.jobId ASC")
    List<JobApplicantCountReportDTO> findJobsRankedByApplicantCount();
}