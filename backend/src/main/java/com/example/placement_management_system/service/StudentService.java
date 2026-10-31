package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.DepartmentRepository;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;

    public StudentService(StudentRepository studentRepository, DepartmentRepository departmentRepository) {
        this.studentRepository = studentRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<Student> getAllStudents() {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot access the full student directory");
        }
        return studentRepository.findAll();
    }

    public Student getStudentById(Integer id) {
        SecurityUtils.validateStudentOwnership(id, "Access denied: Students can only view their own profile");
        return studentRepository.findById(id).orElse(null);
    }

    public Student saveStudent(Student student) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot create academic records");
        }
        if (student == null) {
            throw new IllegalArgumentException("Student payload cannot be empty");
        }
        if (student.getStudentId() == null || student.getStudentId() <= 0) {
            throw new IllegalArgumentException("Valid positive Student ID is required");
        }
        if (studentRepository.existsById(student.getStudentId())) {
            throw new IllegalStateException("Student with ID " + student.getStudentId() + " already exists");
        }
        if (student.getName() == null || student.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Student name is required");
        }
        if (student.getEmail() == null || student.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Student email is required");
        }
        String email = student.getEmail().trim();
        if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Valid email format is required");
        }
        if (studentRepository.existsByEmail(email)) {
            throw new IllegalStateException("Student with email " + email + " already exists");
        }
        if (student.getDepartment() == null || student.getDepartment().getDepartmentId() == null) {
            throw new IllegalArgumentException("Academic department is required");
        }
        Department dept = departmentRepository.findById(student.getDepartment().getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + student.getDepartment().getDepartmentId()));

        if (student.getGraduationYear() == null || student.getGraduationYear() <= 0) {
            throw new IllegalArgumentException("Valid graduation year is required");
        }
        if (student.getCgpa() == null || student.getCgpa() < 0.0 || student.getCgpa() > 10.0) {
            throw new IllegalArgumentException("CGPA must be between 0.00 and 10.00");
        }
        if (student.getBacklogs() == null || student.getBacklogs() < 0) {
            throw new IllegalArgumentException("Backlogs count cannot be negative");
        }

        String placementStatus = student.getPlacementStatus();
        if (placementStatus == null || placementStatus.trim().isEmpty()) {
            placementStatus = "NOT_PLACED";
        } else {
            placementStatus = placementStatus.trim().toUpperCase();
            if (!placementStatus.equals("NOT_PLACED") && !placementStatus.equals("PLACED")) {
                throw new IllegalArgumentException("Invalid placement status. Must be 'NOT_PLACED' or 'PLACED'");
            }
        }

        student.setName(student.getName().trim());
        student.setEmail(email);
        student.setPhone(student.getPhone() != null && !student.getPhone().trim().isEmpty() ? student.getPhone().trim() : null);
        student.setDepartment(dept);
        student.setPlacementStatus(placementStatus);

        return studentRepository.save(student);
    }

    public Student updateStudent(Integer id, Student updatedStudent) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot update academic records");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Student ID is required");
        }
        if (updatedStudent == null) {
            throw new IllegalArgumentException("Updated student data cannot be empty");
        }
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with ID: " + id));

        if (updatedStudent.getName() == null || updatedStudent.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Student name is required");
        }
        if (updatedStudent.getEmail() == null || updatedStudent.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Student email is required");
        }
        String newEmail = updatedStudent.getEmail().trim();
        if (!newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Valid email format is required");
        }
        if (!newEmail.equalsIgnoreCase(existing.getEmail())) {
            Optional<Student> emailOwner = studentRepository.findByEmail(newEmail);
            if (emailOwner.isPresent() && !emailOwner.get().getStudentId().equals(id)) {
                throw new IllegalStateException("Student with email " + newEmail + " already exists");
            }
        }

        if (updatedStudent.getDepartment() == null || updatedStudent.getDepartment().getDepartmentId() == null) {
            throw new IllegalArgumentException("Academic department is required");
        }
        Department dept = departmentRepository.findById(updatedStudent.getDepartment().getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + updatedStudent.getDepartment().getDepartmentId()));

        if (updatedStudent.getGraduationYear() == null || updatedStudent.getGraduationYear() <= 0) {
            throw new IllegalArgumentException("Valid graduation year is required");
        }
        if (updatedStudent.getCgpa() == null || updatedStudent.getCgpa() < 0.0 || updatedStudent.getCgpa() > 10.0) {
            throw new IllegalArgumentException("CGPA must be between 0.00 and 10.00");
        }
        if (updatedStudent.getBacklogs() == null || updatedStudent.getBacklogs() < 0) {
            throw new IllegalArgumentException("Backlogs count cannot be negative");
        }

        String placementStatus = updatedStudent.getPlacementStatus();
        if (placementStatus != null && !placementStatus.trim().isEmpty()) {
            placementStatus = placementStatus.trim().toUpperCase();
            if (!placementStatus.equals("NOT_PLACED") && !placementStatus.equals("PLACED")) {
                throw new IllegalArgumentException("Invalid placement status. Must be 'NOT_PLACED' or 'PLACED'");
            }
            existing.setPlacementStatus(placementStatus);
        }

        existing.setName(updatedStudent.getName().trim());
        existing.setEmail(newEmail);
        existing.setPhone(updatedStudent.getPhone() != null && !updatedStudent.getPhone().trim().isEmpty()
                ? updatedStudent.getPhone().trim() : null);
        existing.setDepartment(dept);
        existing.setGraduationYear(updatedStudent.getGraduationYear());
        existing.setCgpa(updatedStudent.getCgpa());
        existing.setBacklogs(updatedStudent.getBacklogs());

        return studentRepository.save(existing);
    }

    public void deleteStudent(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot delete academic records");
        }
        studentRepository.deleteById(id);
    }
}