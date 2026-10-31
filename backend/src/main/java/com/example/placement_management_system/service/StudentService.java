package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.exception.ResourceNotFoundException;
import com.example.placement_management_system.repository.ApplicationRepository;
import com.example.placement_management_system.repository.AppUserRepository;
import com.example.placement_management_system.repository.DepartmentRepository;
import com.example.placement_management_system.repository.PlacementRepository;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationRepository applicationRepository;
    private final PlacementRepository placementRepository;
    private final AppUserRepository appUserRepository;

    public StudentService(
            StudentRepository studentRepository,
            DepartmentRepository departmentRepository,
            ApplicationRepository applicationRepository,
            PlacementRepository placementRepository,
            AppUserRepository appUserRepository) {
        this.studentRepository = studentRepository;
        this.departmentRepository = departmentRepository;
        this.applicationRepository = applicationRepository;
        this.placementRepository = placementRepository;
        this.appUserRepository = appUserRepository;
    }

    public List<Student> getAllStudents() {
        return getAllStudents(false);
    }

    public List<Student> getAllStudents(boolean includeArchived) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot access the full student directory");
        }
        if (includeArchived) {
            return studentRepository.findAll();
        }
        return studentRepository.findByIsArchivedFalse();
    }

    public List<Student> getStudentsByArchived(boolean archived) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot access the full student directory");
        }
        return studentRepository.findByIsArchived(archived);
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
        student.setIsArchived(false);

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
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

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
        existing.setIsArchived(existing.getIsArchived());

        return studentRepository.save(existing);
    }

    @Transactional
    public Student archiveStudent(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot archive academic records");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Student ID is required");
        }
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        if (Boolean.TRUE.equals(student.getIsArchived())) {
            throw new IllegalStateException("Student " + student.getName() + " (ID #" + id + ") is already archived");
        }

        student.setIsArchived(true);
        Student saved = studentRepository.save(student);

        // Safely disable linked user account without deleting credentials or history
        appUserRepository.findByStudent_StudentId(id).ifPresent(user -> {
            user.setEnabled(false);
            appUserRepository.save(user);
        });

        return saved;
    }

    @Transactional
    public Student unarchiveStudent(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot unarchive academic records");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Student ID is required");
        }
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        if (!Boolean.TRUE.equals(student.getIsArchived())) {
            throw new IllegalStateException("Student " + student.getName() + " (ID #" + id + ") is not archived");
        }

        student.setIsArchived(false);
        Student saved = studentRepository.save(student);

        // Safely re-enable linked user account
        appUserRepository.findByStudent_StudentId(id).ifPresent(user -> {
            user.setEnabled(true);
            appUserRepository.save(user);
        });

        return saved;
    }

    @Transactional
    public void deleteStudent(Integer id) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot delete academic records");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Valid positive Student ID is required");
        }
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        boolean hasApplications = !applicationRepository.findByStudent_StudentId(id).isEmpty();
        boolean hasPlacements = !placementRepository.findByStudent_StudentId(id).isEmpty();
        boolean hasUserAccount = appUserRepository.existsByStudent_StudentId(id);

        if (hasApplications || hasPlacements || hasUserAccount) {
            throw new IllegalStateException("Cannot delete student with associated applications, placements, or user accounts. Please archive the student instead to preserve historical records.");
        }

        studentRepository.delete(student);
    }
}