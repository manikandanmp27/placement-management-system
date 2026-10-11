package com.example.placement_management_system.service;

import com.example.placement_management_system.repository.PlacementStatisticsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlacementStatisticsService {

    private final PlacementStatisticsRepository statisticsRepository;

    public PlacementStatisticsService(
            PlacementStatisticsRepository statisticsRepository) {
        this.statisticsRepository = statisticsRepository;
    }

    public List<Object[]> getStatistics(Integer departmentId) {
        if (departmentId == null || departmentId <= 0) {
            throw new IllegalArgumentException(
                    "Department ID must be positive."
            );
        }

        return statisticsRepository.getStatistics(departmentId);
    }
}
