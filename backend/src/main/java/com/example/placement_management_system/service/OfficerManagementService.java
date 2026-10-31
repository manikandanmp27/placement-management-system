package com.example.placement_management_system.service;

import com.example.placement_management_system.dto.CreateOfficerRequest;
import com.example.placement_management_system.dto.OfficerAccountResponse;
import com.example.placement_management_system.dto.ResetOfficerPasswordRequest;
import com.example.placement_management_system.dto.UpdateOfficerStatusRequest;
import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.exception.ResourceNotFoundException;
import com.example.placement_management_system.repository.AppUserRepository;
import com.example.placement_management_system.security.CustomUserDetails;
import com.example.placement_management_system.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing placement officer accounts.
 * Accessible exclusively to system administrators (ROLE_ADMIN).
 * Never exposes raw passwords or password hashes.
 */
@Service
public class OfficerManagementService {

    private static final Logger logger = LoggerFactory.getLogger(OfficerManagementService.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public OfficerManagementService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public OfficerAccountResponse createOfficer(CreateOfficerRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (appUserRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("An account with this email already exists");
        }

        // Strictly assign ROLE_PLACEMENT_OFFICER on the server. Never accept role from request body.
        AppUser officer = new AppUser(
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_PLACEMENT_OFFICER,
                null);
        officer.setEnabled(true);

        try {
            officer = appUserRepository.save(officer);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("An account with this email already exists");
        }

        logger.info("Administrator created placement officer account with ID: {}", officer.getUserId());
        return toResponse(officer);
    }

    @Transactional(readOnly = true)
    public List<OfficerAccountResponse> getAllOfficers() {
        return appUserRepository.findByRoleOrderByCreatedAtDesc(Role.ROLE_PLACEMENT_OFFICER)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OfficerAccountResponse getOfficerById(Integer id) {
        AppUser user = findOfficerOrThrow(id);
        return toResponse(user);
    }

    @Transactional
    public OfficerAccountResponse updateOfficerStatus(Integer id, UpdateOfficerStatusRequest request) {
        if (request.getEnabled() == null) {
            throw new IllegalArgumentException("Enabled status is required");
        }

        AppUser user = findOfficerOrThrow(id);
        preventSelfModification(id, "modify the status of");

        user.setEnabled(request.getEnabled());
        user = appUserRepository.save(user);

        logger.info("Administrator updated status of officer account ID: {} to enabled={}", id, request.getEnabled());
        return toResponse(user);
    }

    @Transactional
    public OfficerAccountResponse resetOfficerPassword(Integer id, ResetOfficerPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        AppUser user = findOfficerOrThrow(id);
        preventSelfModification(id, "reset the password of");

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user = appUserRepository.save(user);

        logger.info("Administrator successfully reset password for officer account ID: {}", id);
        return toResponse(user);
    }

    private AppUser findOfficerOrThrow(Integer id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Officer account not found with ID: " + id));

        if (user.getRole() != Role.ROLE_PLACEMENT_OFFICER) {
            throw new IllegalArgumentException("Target user is not a placement officer");
        }
        return user;
    }

    private void preventSelfModification(Integer targetUserId, String actionName) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails();
        if (currentUser != null && targetUserId.equals(currentUser.getUserId())) {
            throw new IllegalStateException("Administrators cannot " + actionName + " their own account through officer management");
        }
    }

    private OfficerAccountResponse toResponse(AppUser user) {
        return new OfficerAccountResponse(
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
