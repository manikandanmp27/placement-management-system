package com.example.placement_management_system.dto.report;

import java.time.LocalDate;

public class JobApplicantCountReportDTO {

    private Integer jobId;
    private String jobTitle;
    private String companyName;
    private String jobType;
    private Double packageAmount;
    private LocalDate deadline;
    private Double minCgpa;
    private Integer maxBacklogs;
    private Long applicantCount;

    public JobApplicantCountReportDTO() {
    }

    public JobApplicantCountReportDTO(Integer jobId, String jobTitle, String companyName,
                                      String jobType, Double packageAmount, LocalDate deadline,
                                      Double minCgpa, Integer maxBacklogs, Long applicantCount) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.jobType = jobType;
        this.packageAmount = packageAmount;
        this.deadline = deadline;
        this.minCgpa = minCgpa;
        this.maxBacklogs = maxBacklogs;
        this.applicantCount = applicantCount != null ? applicantCount : 0L;
    }

    public Integer getJobId() {
        return jobId;
    }

    public void setJobId(Integer jobId) {
        this.jobId = jobId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public Double getPackageAmount() {
        return packageAmount;
    }

    public void setPackageAmount(Double packageAmount) {
        this.packageAmount = packageAmount;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public Double getMinCgpa() {
        return minCgpa;
    }

    public void setMinCgpa(Double minCgpa) {
        this.minCgpa = minCgpa;
    }

    public Integer getMaxBacklogs() {
        return maxBacklogs;
    }

    public void setMaxBacklogs(Integer maxBacklogs) {
        this.maxBacklogs = maxBacklogs;
    }

    public Long getApplicantCount() {
        return applicantCount;
    }

    public void setApplicantCount(Long applicantCount) {
        this.applicantCount = applicantCount;
    }
}
