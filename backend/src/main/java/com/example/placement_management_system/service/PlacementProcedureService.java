package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.PlacementProcedureRepository;
import com.example.placement_management_system.repository.StudentRepository;
import org.springframework.stereotype.Service;

@Service
public class PlacementProcedureService {

    private final PlacementProcedureRepository procedureRepository;
    private final StudentRepository studentRepository;

    public PlacementProcedureService(
            PlacementProcedureRepository procedureRepository,
            StudentRepository studentRepository) {
        this.procedureRepository = procedureRepository;
        this.studentRepository = studentRepository;
    }

    public void applyForJob(Integer studentId, Integer jobId) {
        if (studentId != null) {
            Student student = studentRepository.findById(studentId).orElse(null);
            if (student != null && Boolean.TRUE.equals(student.getIsArchived())) {
                throw new IllegalStateException("Archived students are not eligible to apply for jobs.");
            }
        }
        procedureRepository.applyForJob(studentId, jobId);
    }
}