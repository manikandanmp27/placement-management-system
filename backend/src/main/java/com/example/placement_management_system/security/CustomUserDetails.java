package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

    private final Integer userId;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final Integer studentId;
    private final boolean enabled;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(AppUser appUser) {
        this.userId = appUser.getUserId();
        this.email = appUser.getEmail();
        this.passwordHash = appUser.getPasswordHash();
        this.role = appUser.getRole();
        this.studentId = appUser.getStudent() != null ? appUser.getStudent().getStudentId() : null;
        this.enabled = appUser.isEnabled();
        this.authorities = Collections.singletonList(
                new SimpleGrantedAuthority(appUser.getRole().name()));
    }

    public Integer getUserId() {
        return userId;
    }

    public Role getRole() {
        return role;
    }

    public Integer getStudentId() {
        return studentId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
