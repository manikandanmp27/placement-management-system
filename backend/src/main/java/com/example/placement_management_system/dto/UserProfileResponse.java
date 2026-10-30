package com.example.placement_management_system.dto;

import com.example.placement_management_system.entity.Role;
import java.time.LocalDateTime;

public class UserProfileResponse {

    private Integer userId;
    private String email;
    private Role role;
    private Integer studentId;
    private boolean enabled;
    private LocalDateTime createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Integer userId, String email, Role role, Integer studentId, boolean enabled, LocalDateTime createdAt) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.studentId = studentId;
        this.enabled = enabled;
        this.createdAt = createdAt;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
