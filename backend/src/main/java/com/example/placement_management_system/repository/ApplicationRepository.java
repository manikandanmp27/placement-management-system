package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Integer> {
}