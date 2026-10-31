package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Interview;
import com.example.placement_management_system.exception.ResourceNotFoundException;
import com.example.placement_management_system.repository.InterviewRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;

    public InterviewService(InterviewRepository interviewRepository) {
        this.interviewRepository = interviewRepository;
    }

    public List<Interview> getAllInterviews() {
        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null) {
                return Collections.emptyList();
            }
            return interviewRepository.findByApplication_Student_StudentId(studentId);
        }
        return interviewRepository.findAll();
    }

    public Interview getInterviewById(Integer id) {
        Interview interview = interviewRepository.findById(id).orElse(null);
        if (interview == null) {
            return null;
        }

        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null
                    || interview.getApplication() == null
                    || interview.getApplication().getStudent() == null
                    || !studentId.equals(interview.getApplication().getStudent().getStudentId())) {
                throw new AccessDeniedException("Access denied: You cannot access another student's interview");
            }
        }

        return interview;
    }

    public Interview saveInterview(Interview interview) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot schedule interview records");
        }
        return interviewRepository.save(interview);
    }

    public Interview updateInterviewResult(Integer id, String newResultRaw) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot update interview outcomes");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Interview ID is required");
        }
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + id));

        if (newResultRaw == null || newResultRaw.trim().isEmpty()) {
            throw new IllegalArgumentException("Interview result cannot be empty");
        }

        String normalized;
        String trimmed = newResultRaw.trim();
        if (trimmed.equalsIgnoreCase("PENDING")) {
            normalized = "Pending";
        } else if (trimmed.equalsIgnoreCase("PASSED")) {
            normalized = "Passed";
        } else if (trimmed.equalsIgnoreCase("FAILED")) {
            normalized = "Failed";
        } else {
            throw new IllegalArgumentException("Invalid interview result: " + newResultRaw + ". Allowed results are Pending, Passed, Failed");
        }

        String currentResult = interview.getResult() != null ? interview.getResult().trim() : "Pending";
        if (currentResult.equalsIgnoreCase(normalized)) {
            throw new IllegalArgumentException("Interview round is already marked as " + normalized);
        }

        interview.setResult(normalized);
        return interviewRepository.save(interview);
    }

    public Interview updateInterview(Integer id, Interview updated) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot update interviews");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Interview ID is required");
        }
        if (updated == null) {
            throw new IllegalArgumentException("Interview update data cannot be empty");
        }
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + id));

        if (updated.getResult() != null && !updated.getResult().trim().isEmpty()) {
            String trimmed = updated.getResult().trim();
            if (trimmed.equalsIgnoreCase("PENDING")) {
                interview.setResult("Pending");
            } else if (trimmed.equalsIgnoreCase("PASSED")) {
                interview.setResult("Passed");
            } else if (trimmed.equalsIgnoreCase("FAILED")) {
                interview.setResult("Failed");
            } else {
                throw new IllegalArgumentException("Invalid interview result: " + updated.getResult() + ". Allowed results are Pending, Passed, Failed");
            }
        }

        if (updated.getRoundType() != null && !updated.getRoundType().trim().isEmpty()) {
            interview.setRoundType(updated.getRoundType().trim());
        }

        if (updated.getInterviewDate() != null) {
            interview.setInterviewDate(updated.getInterviewDate());
        }

        if (updated.getRoundNumber() != null && updated.getRoundNumber() > 0) {
            interview.setRoundNumber(updated.getRoundNumber());
        }

        return interviewRepository.save(interview);
    }

    public void deleteInterview(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot delete interview records");
        }
        interviewRepository.deleteById(id);
    }
}