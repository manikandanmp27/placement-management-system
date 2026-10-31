package com.example.placement_management_system.service;

import com.example.placement_management_system.dto.report.JobApplicantCountReportDTO;
import com.example.placement_management_system.dto.report.ReportSummaryDTO;
import com.example.placement_management_system.dto.report.StudentInInterviewReportDTO;
import com.example.placement_management_system.dto.report.UnappliedStudentReportDTO;
import com.example.placement_management_system.repository.ApplicationRepository;
import com.example.placement_management_system.repository.JobRepository;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    private final StudentRepository studentRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public ReportService(StudentRepository studentRepository,
                         JobRepository jobRepository,
                         ApplicationRepository applicationRepository) {
        this.studentRepository = studentRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
    }

    public List<UnappliedStudentReportDTO> getStudentsWithNoApplications(boolean includeArchived) {
        validateStaffAccess("view unapplied students report");
        logger.debug("Generating unapplied students report (includeArchived: {})", includeArchived);
        return studentRepository.findStudentsWithNoApplications(includeArchived);
    }

    public List<JobApplicantCountReportDTO> getJobsRankedByApplicantCount() {
        validateStaffAccess("view job applicant rankings report");
        logger.debug("Generating jobs ranked by applicant count report");
        return jobRepository.findJobsRankedByApplicantCount();
    }

    public List<StudentInInterviewReportDTO> getStudentsInInterviewProcess() {
        validateStaffAccess("view students in interview process report");
        logger.debug("Generating students in interview process report");
        return applicationRepository.findStudentsInInterviewProcess();
    }

    public ReportSummaryDTO getReportSummary() {
        validateStaffAccess("view report summary metrics");
        long totalStudents = studentRepository.count();
        long unappliedStudents = studentRepository.countUnappliedActiveStudents();
        long appliedStudents = Math.max(0, totalStudents - unappliedStudents);
        long totalJobs = jobRepository.count();
        long totalApplications = applicationRepository.count();
        long activePipeline = applicationRepository.countActiveInterviewPipelineApplications();

        return new ReportSummaryDTO(
                totalStudents,
                unappliedStudents,
                appliedStudents,
                totalJobs,
                totalApplications,
                activePipeline
        );
    }

    private void validateStaffAccess(String actionDescription) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot " + actionDescription);
        }
    }
}
