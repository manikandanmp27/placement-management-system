package com.example.placement_management_system.service;

import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
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
        return studentRepository.save(student);
    }

    public void deleteStudent(Integer id) {
        studentRepository.deleteById(id);
    }
}