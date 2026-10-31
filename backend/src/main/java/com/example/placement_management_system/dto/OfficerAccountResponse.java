package com.example.placement_management_system.dto;

import com.example.placement_management_system.entity.Role;
import java.time.LocalDateTime;

/**
 * Public response DTO representing a placement officer account.
 * Note: Password hashes and sensitive authentication secrets are strictly omitted.
 */
public class OfficerAccountResponse {

    private Integer userId;
    private String email;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OfficerAccountResponse() {
    }

    public OfficerAccountResponse(Integer userId, String email, Role role, boolean enabled, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
