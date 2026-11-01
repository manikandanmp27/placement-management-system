package com.example.placement_management_system.dto;

import com.example.placement_management_system.entity.Role;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Integer userId;
    private String email;
    private Role role;
    private Integer studentId;
    private Boolean isDemo = false;

    public AuthResponse() {
    }

    public AuthResponse(String token, String tokenType, Integer userId, String email, Role role, Integer studentId) {
        this(token, tokenType, userId, email, role, studentId, false);
    }

    public AuthResponse(String token, String tokenType, Integer userId, String email, Role role, Integer studentId, Boolean isDemo) {
        this.token = token;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.studentId = studentId;
        this.isDemo = isDemo != null ? isDemo : false;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
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

    public Boolean getIsDemo() {
        return isDemo;
    }

    public void setIsDemo(Boolean isDemo) {
        this.isDemo = isDemo;
    }
}
