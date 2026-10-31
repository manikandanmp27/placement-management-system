package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Application;
import com.example.placement_management_system.exception.ResourceNotFoundException;
import com.example.placement_management_system.repository.ApplicationRepository;
import com.example.placement_management_system.repository.PlacementRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final PlacementRepository placementRepository;

    public ApplicationService(ApplicationRepository applicationRepository, PlacementRepository placementRepository) {
        this.applicationRepository = applicationRepository;
        this.placementRepository = placementRepository;
    }

    public List<Application> getAllApplications() {
        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null) {
                return Collections.emptyList();
            }
            return applicationRepository.findByStudent_StudentId(studentId);
        }
        return applicationRepository.findAll();
    }

    public Application getApplicationById(Integer id) {
        Application application = applicationRepository.findById(id).orElse(null);
        if (application == null) {
            return null;
        }

        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null || !studentId.equals(application.getStudent().getStudentId())) {
                throw new AccessDeniedException("Access denied: You cannot access another student's application");
            }
        }

        return application;
    }

    public Application saveApplication(Application application) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot manually create application records");
        }
        return applicationRepository.save(application);
    }

    public Application updateApplicationStatus(Integer id, String newStatusRaw) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot update application status");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Application ID is required");
        }
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        if (newStatusRaw == null || newStatusRaw.trim().isEmpty()) {
            throw new IllegalArgumentException("Application status cannot be empty");
        }
        String newStatus = newStatusRaw.trim().toUpperCase();
        if (!newStatus.equals("APPLIED") && !newStatus.equals("SHORTLISTED")
                && !newStatus.equals("SELECTED") && !newStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid application status: " + newStatusRaw + ". Allowed statuses are APPLIED, SHORTLISTED, SELECTED, REJECTED");
        }

        String currentStatus = application.getStatus() != null ? application.getStatus().trim().toUpperCase() : "APPLIED";
        if (currentStatus.equals(newStatus)) {
            throw new IllegalArgumentException("Application is already in " + currentStatus + " status");
        }

        if ((currentStatus.equals("SELECTED") || currentStatus.equals("REJECTED")) && newStatus.equals("APPLIED")) {
            throw new IllegalStateException("Invalid status transition: Cannot revert a " + currentStatus + " application to APPLIED");
        }

        if (currentStatus.equals("SELECTED") && !newStatus.equals("SELECTED")) {
            if (application.getStudent() != null && application.getJob() != null) {
                boolean isPlaced = placementRepository.existsByStudent_StudentIdAndJob_JobId(
                        application.getStudent().getStudentId(), application.getJob().getJobId());
                if (isPlaced) {
                    throw new IllegalStateException("Cannot change status of an application that already has a finalized placement offer");
                }
            }
        }

        application.setStatus(newStatus);
        return applicationRepository.save(application);
    }

    public Application updateApplication(Integer id, Application updated) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot update applications");
        }
        if (updated == null || updated.getStatus() == null) {
            throw new IllegalArgumentException("Application status is required");
        }
        return updateApplicationStatus(id, updated.getStatus());
    }

    public void deleteApplication(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot delete application records");
        }
        applicationRepository.deleteById(id);
    }
}