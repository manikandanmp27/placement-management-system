package com.example.placement_management_system.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload for administrator enable/disable action on an officer account.
 */
public class UpdateOfficerStatusRequest {

    @NotNull(message = "Enabled status is required")
    private Boolean enabled;

    public UpdateOfficerStatusRequest() {
    }

    public UpdateOfficerStatusRequest(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
