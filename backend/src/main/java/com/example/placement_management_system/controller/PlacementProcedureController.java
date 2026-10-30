package com.example.placement_management_system.controller;

import com.example.placement_management_system.security.SecurityUtils;
import com.example.placement_management_system.service.PlacementProcedureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/procedures")
public class PlacementProcedureController {

    private final PlacementProcedureService procedureService;

    public PlacementProcedureController(PlacementProcedureService procedureService) {
        this.procedureService = procedureService;
    }

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public ResponseEntity<String> applyForJob(
            @RequestParam(required = false) Integer studentId,
            @RequestParam Integer jobId) {

        if (jobId == null || jobId <= 0) {
            return ResponseEntity.badRequest().body("Job ID must be positive.");
        }

        Integer effectiveStudentId;

        if (SecurityUtils.isStudent()) {
            effectiveStudentId = SecurityUtils.getCurrentStudentId();
            if (effectiveStudentId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Authenticated student account has no associated student record.");
            }
            if (studentId != null && !studentId.equals(effectiveStudentId)) {
                throw new AccessDeniedException("Access denied: Students can only apply for jobs on their own behalf");
            }
        } else {
            if (studentId == null || studentId <= 0) {
                return ResponseEntity.badRequest().body("Student ID must be positive.");
            }
            effectiveStudentId = studentId;
        }

        procedureService.applyForJob(effectiveStudentId, jobId);
        return ResponseEntity.ok("Application submitted successfully");
    }
}
