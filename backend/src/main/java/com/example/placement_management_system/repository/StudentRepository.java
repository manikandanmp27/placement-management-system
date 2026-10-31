package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.placement_management_system.dto.report.UnappliedStudentReportDTO;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Integer> {

    boolean existsByEmail(String email);

    Optional<Student> findByEmail(String email);

    List<Student> findByIsArchivedFalse();

    List<Student> findByIsArchivedTrue();

    List<Student> findByIsArchived(Boolean isArchived);

    long countByDepartment_DepartmentId(Integer departmentId);

    boolean existsByDepartment_DepartmentId(Integer departmentId);

    @Query("SELECT new com.example.placement_management_system.dto.report.UnappliedStudentReportDTO(" +
           "s.studentId, s.name, s.email, s.phone, d.departmentName, s.cgpa, s.backlogs, s.placementStatus, s.graduationYear, s.isArchived) " +
           "FROM Student s " +
           "LEFT JOIN s.department d " +
           "WHERE NOT EXISTS (SELECT 1 FROM Application a WHERE a.student.studentId = s.studentId) " +
           "AND (:includeArchived = true OR s.isArchived = false) " +
           "ORDER BY s.studentId ASC")
    List<UnappliedStudentReportDTO> findStudentsWithNoApplications(@Param("includeArchived") boolean includeArchived);

    @Query("SELECT COUNT(s) FROM Student s WHERE NOT EXISTS (SELECT 1 FROM Application a WHERE a.student.studentId = s.studentId) AND s.isArchived = false")
    long countUnappliedActiveStudents();
}