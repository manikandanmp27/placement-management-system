package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Integer> {
}