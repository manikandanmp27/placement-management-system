package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.service.DepartmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public List<Department> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public Department getDepartmentById(@PathVariable Integer id) {
        return departmentService.getDepartmentById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        Department created = departmentService.saveDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public ResponseEntity<Department> updateDepartment(@PathVariable Integer id, @RequestBody Department department) {
        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public void deleteDepartment(@PathVariable Integer id) {
        departmentService.deleteDepartment(id);
    }
}