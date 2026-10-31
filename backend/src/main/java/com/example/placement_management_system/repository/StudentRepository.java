package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Integer> {

    boolean existsByEmail(String email);

    Optional<Student> findByEmail(String email);

    List<Student> findByIsArchivedFalse();

    List<Student> findByIsArchivedTrue();

    List<Student> findByIsArchived(Boolean isArchived);
}