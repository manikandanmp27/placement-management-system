package com.example.placement_management_system.dto;

import jakarta.validation.constraints.NotBlank;

public class DemoLoginRequest {

    @NotBlank(message = "Role is required")
    private String role;

    public DemoLoginRequest() {
    }

    public DemoLoginRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
