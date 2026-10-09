
package com.example.placement_management_system.controller;

import com.example.placement_management_system.service.PlacementProcedureService;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/procedures")
public class PlacementProcedureController {

    private final PlacementProcedureService procedureService;

    public PlacementProcedureController(
            PlacementProcedureService procedureService) {
        this.procedureService = procedureService;
    }

    @PostMapping("/apply")
    public ResponseEntity<String> applyForJob(
            @RequestParam Integer studentId,
            @RequestParam Integer jobId) {

        if (studentId <= 0 || jobId <= 0) {
            return ResponseEntity.badRequest()
                    .body("Student ID and Job ID must be positive.");
        }

        procedureService.applyForJob(studentId, jobId);
        return ResponseEntity.ok("Application submitted successfully");
    }
}
