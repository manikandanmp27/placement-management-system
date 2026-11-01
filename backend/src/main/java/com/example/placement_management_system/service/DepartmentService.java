package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.exception.ResourceNotFoundException;
import com.example.placement_management_system.repository.DepartmentRepository;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);

    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;

    public DepartmentService(DepartmentRepository departmentRepository, StudentRepository studentRepository) {
        this.departmentRepository = departmentRepository;
        this.studentRepository = studentRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAllByOrderByDepartmentIdAsc();
    }

    public Department getDepartmentById(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
    }

    @Transactional
    public Department saveDepartment(Department department) {
        validateStaffAccess("create departments");

        if (department == null) {
            throw new IllegalArgumentException("Department payload cannot be empty");
        }

        if (department.getDepartmentName() == null || department.getDepartmentName().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }

        String normalizedName = department.getDepartmentName().trim();
        if (normalizedName.length() > 100) {
            throw new IllegalArgumentException("Department name cannot exceed 100 characters");
        }

        if (departmentRepository.existsByDepartmentNameIgnoreCase(normalizedName)) {
            throw new IllegalStateException("Department with name '" + normalizedName + "' already exists");
        }

        if (department.getDepartmentId() != null) {
            if (department.getDepartmentId() <= 0) {
                throw new IllegalArgumentException("Department ID must be a positive integer");
            }
            if (departmentRepository.existsById(department.getDepartmentId())) {
                throw new IllegalStateException("Department with ID " + department.getDepartmentId() + " already exists");
            }
        } else {
            department.setDepartmentId(departmentRepository.getNextDepartmentId());
        }

        department.setDepartmentName(normalizedName);
        Department saved = departmentRepository.save(department);
        logger.info("Created department with ID: {} and name: '{}'", saved.getDepartmentId(), saved.getDepartmentName());
        return saved;
    }

    @Transactional
    public Department updateDepartment(Integer id, Department department) {
        validateStaffAccess("update departments");

        if (department == null) {
            throw new IllegalArgumentException("Department payload cannot be empty");
        }

        if (department.getDepartmentName() == null || department.getDepartmentName().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }

        String normalizedName = department.getDepartmentName().trim();
        if (normalizedName.length() > 100) {
            throw new IllegalArgumentException("Department name cannot exceed 100 characters");
        }

        Department existingDept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        Optional<Department> withSameName = departmentRepository.findByDepartmentNameIgnoreCase(normalizedName);
        if (withSameName.isPresent() && !withSameName.get().getDepartmentId().equals(id)) {
            throw new IllegalStateException("Department with name '" + normalizedName + "' already exists");
        }

        existingDept.setDepartmentName(normalizedName);
        Department updated = departmentRepository.save(existingDept);
        logger.info("Updated department ID: {} name to: '{}'", id, normalizedName);
        return updated;
    }

    @Transactional
    public void deleteDepartment(Integer id) {
        validateStaffAccess("delete departments");
        SecurityUtils.validateNotDemo("Department deletion");

        Department existingDept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        long studentCount = studentRepository.countByDepartment_DepartmentId(id);
        if (studentCount > 0) {
            throw new IllegalStateException("Cannot delete department '" + existingDept.getDepartmentName() +
                    "' because it is referenced by " + studentCount +
                    " student record(s). Retain the department to preserve academic history.");
        }

        try {
            departmentRepository.delete(existingDept);
            logger.info("Deleted department with ID: {} and name: '{}'", id, existingDept.getDepartmentName());
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Cannot delete department '" + existingDept.getDepartmentName() +
                    "' because it is referenced by existing database records. Retain the department to preserve relational integrity.");
        }
    }

    private void validateStaffAccess(String actionDescription) {
        if (SecurityUtils.isStudent()) {
            throw new AccessDeniedException("Access denied: Students cannot " + actionDescription);
        }
    }
}