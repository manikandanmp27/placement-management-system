package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Interview;
import com.example.placement_management_system.service.InterviewService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @GetMapping
    public List<Interview> getAllInterviews() {
        return interviewService.getAllInterviews();
    }

    @GetMapping("/{id}")
    public Interview getInterviewById(@PathVariable Integer id) {
        return interviewService.getInterviewById(id);
    }

    @PostMapping
    public Interview createInterview(@RequestBody Interview interview) {
        return interviewService.saveInterview(interview);
    }

    @DeleteMapping("/{id}")
    public void deleteInterview(@PathVariable Integer id) {
        interviewService.deleteInterview(id);
    }
}