package com.example.placement_management_system.controller;

import com.example.placement_management_system.dto.report.JobApplicantCountReportDTO;
import com.example.placement_management_system.dto.report.ReportSummaryDTO;
import com.example.placement_management_system.dto.report.StudentInInterviewReportDTO;
import com.example.placement_management_system.dto.report.UnappliedStudentReportDTO;
import com.example.placement_management_system.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/unapplied-students")
    public ResponseEntity<List<UnappliedStudentReportDTO>> getStudentsWithNoApplications(
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived) {
        List<UnappliedStudentReportDTO> report = reportService.getStudentsWithNoApplications(includeArchived);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/jobs-by-applicants")
    public ResponseEntity<List<JobApplicantCountReportDTO>> getJobsRankedByApplicantCount() {
        List<JobApplicantCountReportDTO> report = reportService.getJobsRankedByApplicantCount();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/students-in-interview-process")
    public ResponseEntity<List<StudentInInterviewReportDTO>> getStudentsInInterviewProcess() {
        List<StudentInInterviewReportDTO> report = reportService.getStudentsInInterviewProcess();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDTO> getReportSummary() {
        ReportSummaryDTO summary = reportService.getReportSummary();
        return ResponseEntity.ok(summary);
    }
}
