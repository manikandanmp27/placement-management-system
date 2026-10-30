package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Placement;
import com.example.placement_management_system.repository.PlacementRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class PlacementService {

    private final PlacementRepository placementRepository;

    public PlacementService(PlacementRepository placementRepository) {
        this.placementRepository = placementRepository;
    }

    public List<Placement> getAllPlacements() {
        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null) {
                return Collections.emptyList();
            }
            return placementRepository.findByStudent_StudentId(studentId);
        }
        return placementRepository.findAll();
    }

    public Placement getPlacementById(Integer id) {
        Placement placement = placementRepository.findById(id).orElse(null);
        if (placement == null) {
            return null;
        }

        if (SecurityUtils.isStudent()) {
            Integer studentId = SecurityUtils.getCurrentStudentId();
            if (studentId == null
                    || placement.getStudent() == null
                    || !studentId.equals(placement.getStudent().getStudentId())) {
                throw new AccessDeniedException("Access denied: You cannot access another student's placement");
            }
        }

        return placement;
    }

    public Placement savePlacement(Placement placement) {
        return placementRepository.save(placement);
    }

    public void deletePlacement(Integer id) {
        placementRepository.deleteById(id);
    }
}