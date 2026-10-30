package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Application;
import com.example.placement_management_system.repository.ApplicationRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
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
        return applicationRepository.save(application);
    }

    public void deleteApplication(Integer id) {
        applicationRepository.deleteById(id);
    }
}