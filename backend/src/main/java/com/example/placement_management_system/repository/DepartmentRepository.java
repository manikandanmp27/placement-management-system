package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    boolean existsByDepartmentNameIgnoreCase(String departmentName);

    Optional<Department> findByDepartmentNameIgnoreCase(String departmentName);

    @Query("SELECT COALESCE(MAX(d.departmentId), 0) + 1 FROM Department d")
    Integer getNextDepartmentId();

    List<Department> findAllByOrderByDepartmentIdAsc();
}