package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Placement;
import com.example.placement_management_system.service.PlacementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/placements")
public class PlacementController {

    private final PlacementService placementService;

    public PlacementController(PlacementService placementService) {
        this.placementService = placementService;
    }

    @GetMapping
    public List<Placement> getAllPlacements() {
        return placementService.getAllPlacements();
    }

    @GetMapping("/{id}")
    public Placement getPlacementById(@PathVariable Integer id) {
        return placementService.getPlacementById(id);
    }

    @PostMapping
    public Placement createPlacement(@RequestBody Placement placement) {
        return placementService.savePlacement(placement);
    }

    @DeleteMapping("/{id}")
    public void deletePlacement(@PathVariable Integer id) {
        placementService.deletePlacement(id);
    }
}