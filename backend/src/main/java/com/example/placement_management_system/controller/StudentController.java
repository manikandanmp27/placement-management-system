package com.example.placement_management_system.controller;

import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.service.StudentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public List<Student> getAllStudents(
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived,
            @RequestParam(required = false) Boolean archived) {
        if (archived != null) {
            return studentService.getStudentsByArchived(archived);
        }
        return studentService.getAllStudents(includeArchived);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public Student getCurrentStudentProfile() {
        return studentService.getCurrentStudentProfile();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'PLACEMENT_OFFICER', 'ADMIN')")
    public Student getStudentById(@PathVariable Integer id) {
        return studentService.getStudentById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Student createStudent(@RequestBody Student student) {
        return studentService.saveStudent(student);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Student updateStudent(@PathVariable Integer id, @RequestBody Student student) {
        return studentService.updateStudent(id, student);
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Student archiveStudent(@PathVariable Integer id) {
        return studentService.archiveStudent(id);
    }

    @PutMapping("/{id}/unarchive")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public Student unarchiveStudent(@PathVariable Integer id) {
        return studentService.unarchiveStudent(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLACEMENT_OFFICER', 'ADMIN')")
    public void deleteStudent(@PathVariable Integer id) {
        studentService.deleteStudent(id);
    }
}