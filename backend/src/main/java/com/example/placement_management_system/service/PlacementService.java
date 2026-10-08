package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Placement;
import com.example.placement_management_system.repository.PlacementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlacementService {

    private final PlacementRepository placementRepository;

    public PlacementService(PlacementRepository placementRepository) {
        this.placementRepository = placementRepository;
    }

    public List<Placement> getAllPlacements() {
        return placementRepository.findAll();
    }

    public Placement getPlacementById(Integer id) {
        return placementRepository.findById(id).orElse(null);
    }

    public Placement savePlacement(Placement placement) {
        return placementRepository.save(placement);
    }

    public void deletePlacement(Integer id) {
        placementRepository.deleteById(id);
    }
}