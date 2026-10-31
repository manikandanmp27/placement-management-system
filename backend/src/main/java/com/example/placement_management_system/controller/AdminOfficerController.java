package com.example.placement_management_system.controller;

import com.example.placement_management_system.dto.CreateOfficerRequest;
import com.example.placement_management_system.dto.OfficerAccountResponse;
import com.example.placement_management_system.dto.ResetOfficerPasswordRequest;
import com.example.placement_management_system.dto.UpdateOfficerStatusRequest;
import com.example.placement_management_system.service.OfficerManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller providing administrator-only placement officer account management.
 * Strictly forbidden for students and placement officers.
 */
@RestController
@RequestMapping("/api/admin/officers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOfficerController {

    private final OfficerManagementService officerManagementService;

    public AdminOfficerController(OfficerManagementService officerManagementService) {
        this.officerManagementService = officerManagementService;
    }

    @PostMapping
    public ResponseEntity<OfficerAccountResponse> createOfficer(@Valid @RequestBody CreateOfficerRequest request) {
        OfficerAccountResponse response = officerManagementService.createOfficer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<OfficerAccountResponse>> getAllOfficers() {
        return ResponseEntity.ok(officerManagementService.getAllOfficers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfficerAccountResponse> getOfficerById(@PathVariable Integer id) {
        return ResponseEntity.ok(officerManagementService.getOfficerById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OfficerAccountResponse> updateOfficerStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateOfficerStatusRequest request) {
        return ResponseEntity.ok(officerManagementService.updateOfficerStatus(id, request));
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<OfficerAccountResponse> resetOfficerPassword(
            @PathVariable Integer id,
            @Valid @RequestBody ResetOfficerPasswordRequest request) {
        return ResponseEntity.ok(officerManagementService.resetOfficerPassword(id, request));
    }
}
