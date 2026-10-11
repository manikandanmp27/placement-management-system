package com.example.placement_management_system.controller;

import com.example.placement_management_system.service.PlacementStatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/procedures")
public class PlacementStatisticsController {

    private final PlacementStatisticsService statisticsService;

    public PlacementStatisticsController(
            PlacementStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/placement-statistics")
    public ResponseEntity<?> getStatistics(
            @RequestParam Integer departmentId) {
        try {
            List<Object[]> statistics =
                    statisticsService.getStatistics(departmentId);

            if (statistics.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(statistics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
