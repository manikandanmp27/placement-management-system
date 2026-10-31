package com.example.placement_management_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for administrator password reset on an officer account.
 */
public class ResetOfficerPasswordRequest {

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
    private String newPassword;

    public ResetOfficerPasswordRequest() {
    }

    public ResetOfficerPasswordRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
