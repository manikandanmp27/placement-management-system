package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Interview;
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
        return interviewRepository.save(interview);
    }

    public void deleteInterview(Integer id) {
        interviewRepository.deleteById(id);
    }
}