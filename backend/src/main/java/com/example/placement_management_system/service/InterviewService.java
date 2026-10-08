package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Interview;
import com.example.placement_management_system.repository.InterviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;

    public InterviewService(InterviewRepository interviewRepository) {
        this.interviewRepository = interviewRepository;
    }

    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public Interview getInterviewById(Integer id) {
        return interviewRepository.findById(id).orElse(null);
    }

    public Interview saveInterview(Interview interview) {
        return interviewRepository.save(interview);
    }

    public void deleteInterview(Integer id) {
        interviewRepository.deleteById(id);
    }
}