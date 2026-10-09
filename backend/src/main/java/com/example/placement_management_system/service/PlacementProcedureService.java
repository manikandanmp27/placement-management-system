package com.example.placement_management_system.service;

import com.example.placement_management_system.repository.PlacementProcedureRepository;
import org.springframework.stereotype.Service;

@Service
public class PlacementProcedureService {

    private final PlacementProcedureRepository procedureRepository;

    public PlacementProcedureService(
            PlacementProcedureRepository procedureRepository) {
        this.procedureRepository = procedureRepository;
    }

    public void applyForJob(Integer studentId, Integer jobId) {
        procedureRepository.applyForJob(studentId, jobId);
    }
}