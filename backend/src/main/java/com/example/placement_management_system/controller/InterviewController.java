package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Interview;
import com.example.placement_management_system.service.InterviewService;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public List<Interview> getAllInterviews() {
        return interviewService.getAllInterviews();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public Interview getInterviewById(@PathVariable Integer id) {
        return interviewService.getInterviewById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Interview createInterview(@RequestBody Interview interview) {
        return interviewService.saveInterview(interview);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Interview updateInterview(@PathVariable Integer id, @RequestBody(required = false) Interview interview) {
        if (interview == null) {
            throw new IllegalArgumentException("Request body cannot be empty");
        }
        return interviewService.updateInterview(id, interview);
    }

    @PutMapping("/{id}/result")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Interview updateInterviewResult(@PathVariable Integer id, @RequestBody com.example.placement_management_system.dto.UpdateInterviewResultRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be empty");
        }
        return interviewService.updateInterviewResult(id, request.getResult());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public void deleteInterview(@PathVariable Integer id) {
        interviewService.deleteInterview(id);
    }
}