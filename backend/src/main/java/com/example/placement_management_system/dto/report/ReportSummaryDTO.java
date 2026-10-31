package com.example.placement_management_system.dto.report;

public class ReportSummaryDTO {

    private long totalStudents;
    private long unappliedStudentsCount;
    private long appliedStudentsCount;
    private long totalJobs;
    private long totalApplications;
    private long activeInterviewPipelineCount;

    public ReportSummaryDTO() {
    }

    public ReportSummaryDTO(long totalStudents, long unappliedStudentsCount, long appliedStudentsCount,
                            long totalJobs, long totalApplications, long activeInterviewPipelineCount) {
        this.totalStudents = totalStudents;
        this.unappliedStudentsCount = unappliedStudentsCount;
        this.appliedStudentsCount = appliedStudentsCount;
        this.totalJobs = totalJobs;
        this.totalApplications = totalApplications;
        this.activeInterviewPipelineCount = activeInterviewPipelineCount;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getUnappliedStudentsCount() {
        return unappliedStudentsCount;
    }

    public void setUnappliedStudentsCount(long unappliedStudentsCount) {
        this.unappliedStudentsCount = unappliedStudentsCount;
    }

    public long getAppliedStudentsCount() {
        return appliedStudentsCount;
    }

    public void setAppliedStudentsCount(long appliedStudentsCount) {
        this.appliedStudentsCount = appliedStudentsCount;
    }

    public long getTotalJobs() {
        return totalJobs;
    }

    public void setTotalJobs(long totalJobs) {
        this.totalJobs = totalJobs;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getActiveInterviewPipelineCount() {
        return activeInterviewPipelineCount;
    }

    public void setActiveInterviewPipelineCount(long activeInterviewPipelineCount) {
        this.activeInterviewPipelineCount = activeInterviewPipelineCount;
    }
}
