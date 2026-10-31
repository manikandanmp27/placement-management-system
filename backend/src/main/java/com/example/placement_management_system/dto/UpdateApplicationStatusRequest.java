package com.example.placement_management_system.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateApplicationStatusRequest {

    @NotBlank(message = "Application status is required")
    private String status;

    public UpdateApplicationStatusRequest() {}

    public UpdateApplicationStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
