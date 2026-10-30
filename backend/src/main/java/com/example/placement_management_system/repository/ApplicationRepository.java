package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudent_StudentId(Integer studentId);
}