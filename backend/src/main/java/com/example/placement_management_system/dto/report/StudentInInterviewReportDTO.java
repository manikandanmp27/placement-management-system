package com.example.placement_management_system.dto.report;

import java.time.LocalDate;

public class StudentInInterviewReportDTO {

    private Integer studentId;
    private String studentName;
    private String email;
    private String departmentName;
    private Integer jobId;
    private String jobTitle;
    private String companyName;
    private Integer applicationId;
    private String applicationStatus;
    private Integer interviewId;
    private Integer roundNumber;
    private String roundType;
    private LocalDate interviewDate;
    private String interviewResult;

    public StudentInInterviewReportDTO() {
    }

    public StudentInInterviewReportDTO(Integer studentId, String studentName, String email,
                                       String departmentName, Integer jobId, String jobTitle,
                                       String companyName, Integer applicationId, String applicationStatus,
                                       Integer interviewId, Integer roundNumber, String roundType,
                                       LocalDate interviewDate, String interviewResult) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.departmentName = departmentName;
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.companyName = companyName;
        this.applicationId = applicationId;
        this.applicationStatus = applicationStatus;
        this.interviewId = interviewId;
        this.roundNumber = roundNumber;
        this.roundType = roundType;
        this.interviewDate = interviewDate;
        this.interviewResult = interviewResult;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
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

    public Integer getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Integer applicationId) {
        this.applicationId = applicationId;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public void setApplicationStatus(String applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    public Integer getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(Integer interviewId) {
        this.interviewId = interviewId;
    }

    public Integer getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(Integer roundNumber) {
        this.roundNumber = roundNumber;
    }

    public String getRoundType() {
        return roundType;
    }

    public void setRoundType(String roundType) {
        this.roundType = roundType;
    }

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(LocalDate interviewDate) {
        this.interviewDate = interviewDate;
    }

    public String getInterviewResult() {
        return interviewResult;
    }

    public void setInterviewResult(String interviewResult) {
        this.interviewResult = interviewResult;
    }
}
