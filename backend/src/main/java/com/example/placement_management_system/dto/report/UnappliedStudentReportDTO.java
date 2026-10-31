package com.example.placement_management_system.dto.report;

public class UnappliedStudentReportDTO {

    private Integer studentId;
    private String name;
    private String email;
    private String phone;
    private String departmentName;
    private Double cgpa;
    private Integer backlogs;
    private String placementStatus;
    private Integer graduationYear;
    private Boolean isArchived;

    public UnappliedStudentReportDTO() {
    }

    public UnappliedStudentReportDTO(Integer studentId, String name, String email, String phone,
                                     String departmentName, Double cgpa, Integer backlogs,
                                     String placementStatus, Integer graduationYear, Boolean isArchived) {
        this.studentId = studentId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.departmentName = departmentName;
        this.cgpa = cgpa;
        this.backlogs = backlogs;
        this.placementStatus = placementStatus;
        this.graduationYear = graduationYear;
        this.isArchived = isArchived;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Double getCgpa() {
        return cgpa;
    }

    public void setCgpa(Double cgpa) {
        this.cgpa = cgpa;
    }

    public Integer getBacklogs() {
        return backlogs;
    }

    public void setBacklogs(Integer backlogs) {
        this.backlogs = backlogs;
    }

    public String getPlacementStatus() {
        return placementStatus;
    }

    public void setPlacementStatus(String placementStatus) {
        this.placementStatus = placementStatus;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
    }

    public Boolean getIsArchived() {
        return isArchived;
    }

    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }
}
