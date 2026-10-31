package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Application;
import com.example.placement_management_system.service.ApplicationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public List<Application> getAllApplications() {
        return applicationService.getAllApplications();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public Application getApplicationById(@PathVariable Integer id) {
        return applicationService.getApplicationById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Application createApplication(@RequestBody Application application) {
        return applicationService.saveApplication(application);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Application updateApplication(@PathVariable Integer id, @RequestBody(required = false) Application application) {
        if (application == null) {
            throw new IllegalArgumentException("Request body cannot be empty");
        }
        return applicationService.updateApplication(id, application);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Application updateApplicationStatus(@PathVariable Integer id, @RequestBody com.example.placement_management_system.dto.UpdateApplicationStatusRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be empty");
        }
        return applicationService.updateApplicationStatus(id, request.getStatus());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public void deleteApplication(@PathVariable Integer id) {
        applicationService.deleteApplication(id);
    }
}