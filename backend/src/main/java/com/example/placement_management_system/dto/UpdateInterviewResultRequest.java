package com.example.placement_management_system.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateInterviewResultRequest {

    @NotBlank(message = "Interview result is required")
    private String result;

    public UpdateInterviewResultRequest() {}

    public UpdateInterviewResultRequest(String result) {
        this.result = result;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}
