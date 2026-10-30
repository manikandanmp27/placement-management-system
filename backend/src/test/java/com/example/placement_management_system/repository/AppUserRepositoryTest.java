package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.entity.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AppUserRepositoryTest {

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Test
    @DisplayName("Verify user creation, unique constraints, and student linking")
    void testUserPersistenceAndLinking() {
        // Setup academic department and student
        Department dept = new Department();
        dept.setDepartmentId(99);
        dept.setDepartmentName("Computer Science Test");
        departmentRepository.save(dept);

        Student student = new Student();
        student.setStudentId(901);
        student.setName("Test Student");
        student.setEmail("test.student@example.com");
        student.setDepartment(dept);
        student.setGraduationYear(2027);
        student.setCgpa(8.5);
        student.setBacklogs(0);
        student.setPlacementStatus("NOT_PLACED");
        studentRepository.save(student);

        // Create student user
        AppUser studentUser = new AppUser("test.student@example.com", "$2a$12$hashedPassword", Role.ROLE_STUDENT, student);
        AppUser savedUser = userRepository.save(studentUser);

        assertNotNull(savedUser.getUserId());
        assertNotNull(savedUser.getCreatedAt());
        assertTrue(savedUser.isEnabled());
        assertEquals(901, savedUser.getStudentId());

        // Verify repository lookups
        assertTrue(userRepository.existsByEmail("test.student@example.com"));
        assertFalse(userRepository.existsByEmail("nonexistent@example.com"));

        Optional<AppUser> byEmail = userRepository.findByEmail("test.student@example.com");
        assertTrue(byEmail.isPresent());
        assertEquals(Role.ROLE_STUDENT, byEmail.get().getRole());

        // Verify student ID queries
        assertTrue(userRepository.existsByStudent_StudentId(901));
        assertTrue(userRepository.existsByStudentId(901));

        Optional<AppUser> byStudent = userRepository.findByStudent_StudentId(901);
        assertTrue(byStudent.isPresent());
        assertEquals(savedUser.getUserId(), byStudent.get().getUserId());

        // Create admin user (student is null)
        AppUser adminUser = new AppUser("admin@example.com", "$2a$12$hashedPassword", Role.ROLE_ADMIN, null);
        userRepository.save(adminUser);

        // Verify role counting
        assertEquals(1, userRepository.countByRole(Role.ROLE_STUDENT));
        assertEquals(1, userRepository.countByRole(Role.ROLE_ADMIN));
        assertEquals(0, userRepository.countByRole(Role.ROLE_PLACEMENT_OFFICER));

        // Verify that deleting user does NOT delete the student record (no cascade delete)
        userRepository.delete(savedUser);
        userRepository.flush();

        assertFalse(userRepository.existsByEmail("test.student@example.com"));
        assertTrue(studentRepository.existsById(901), "Student record must remain intact when user account is deleted");
    }
}
