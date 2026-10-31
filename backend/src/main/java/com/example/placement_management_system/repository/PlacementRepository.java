package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Placement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlacementRepository extends JpaRepository<Placement, Integer> {
    List<Placement> findByStudent_StudentId(Integer studentId);

    boolean existsByStudent_StudentIdAndJob_JobId(Integer studentId, Integer jobId);
}