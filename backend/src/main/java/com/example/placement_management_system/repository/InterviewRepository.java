package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Integer> {
    List<Interview> findByApplication_Student_StudentId(Integer studentId);
}