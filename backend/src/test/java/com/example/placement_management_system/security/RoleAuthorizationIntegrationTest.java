package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.AppUserRepository;
import com.example.placement_management_system.repository.DepartmentRepository;
import com.example.placement_management_system.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class RoleAuthorizationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private String studentToken;
    private String officerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        appUserRepository.deleteAll();
        studentRepository.deleteAll();
        departmentRepository.deleteAll();

        Department dept = new Department();
        dept.setDepartmentId(1);
        dept.setDepartmentName("CSE");
        dept = departmentRepository.save(dept);

        Student student = new Student();
        student.setStudentId(101);
        student.setName("Student One");
        student.setEmail("student1@university.edu");
        student.setDepartment(dept);
        student.setGraduationYear(2025);
        student.setCgpa(8.5);
        student.setBacklogs(0);
        student.setPlacementStatus("NOT_PLACED");
        student = studentRepository.save(student);

        AppUser studentUser = new AppUser(
                student.getEmail(),
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                student);
        studentUser.setEnabled(true);
        studentUser = appUserRepository.save(studentUser);
        studentToken = jwtService.generateToken(studentUser.getEmail(), studentUser.getUserId(), studentUser.getRole(), student.getStudentId());

        AppUser officerUser = new AppUser(
                "officer@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_PLACEMENT_OFFICER,
                null);
        officerUser.setEnabled(true);
        officerUser = appUserRepository.save(officerUser);
        officerToken = jwtService.generateToken(officerUser.getEmail(), officerUser.getUserId(), officerUser.getRole(), null);

        AppUser adminUser = new AppUser(
                "admin@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_ADMIN,
                null);
        adminUser.setEnabled(true);
        adminUser = appUserRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getUserId(), adminUser.getRole(), null);
    }

    @Test
    @DisplayName("Student can view jobs and companies")
    void studentCanBrowseJobsAndCompanies() throws Exception {
        mockMvc.perform(get("/api/jobs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/companies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Student cannot create or delete jobs")
    void studentCannotCreateOrDeleteJobs() throws Exception {
        mockMvc.perform(post("/api/jobs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jobTitle\":\"Software Engineer\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/jobs/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student cannot view complete student directory")
    void studentCannotAccessStudentDirectory() throws Exception {
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Placement Officer can access student directory and manage placement entities")
    void placementOfficerCanManagePlacementOperations() throws Exception {
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/placements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin can perform Placement Officer operations across modules")
    void adminCanPerformPlacementOperations() throws Exception {
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/jobs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/companies")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Student cannot create, edit, or delete academic student records")
    void studentCannotCreateEditOrDeleteStudentRecords() throws Exception {
        String newStudentJson = "{"
                + "\"studentId\":201,"
                + "\"name\":\"Intruder\","
                + "\"email\":\"intruder@university.edu\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":9.0,"
                + "\"backlogs\":0,"
                + "\"placementStatus\":\"NOT_PLACED\""
                + "}";

        // Student POST attempt
        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newStudentJson))
                .andExpect(status().isForbidden());

        // Student PUT attempt
        String updateJson = "{"
                + "\"name\":\"Student Altered\","
                + "\"email\":\"student1@university.edu\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":9.9,"
                + "\"backlogs\":0,"
                + "\"placementStatus\":\"PLACED\""
                + "}";

        mockMvc.perform(put("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isForbidden());

        // Student DELETE attempt
        mockMvc.perform(delete("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Placement Officer can create and edit academic student records")
    void officerCanCreateAndEditStudentRecords() throws Exception {
        String createJson = "{"
                + "\"studentId\":202,"
                + "\"name\":\"Priya Sharma\","
                + "\"email\":\"priya.sharma@university.edu\","
                + "\"phone\":\"9876543210\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2026,"
                + "\"cgpa\":8.85,"
                + "\"backlogs\":0,"
                + "\"placementStatus\":\"NOT_PLACED\""
                + "}";

        // Officer creates record
        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isOk());

        // Officer edits record
        String updateJson = "{"
                + "\"name\":\"Priya Sharma Updated\","
                + "\"email\":\"priya.updated@university.edu\","
                + "\"phone\":\"9876543210\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2026,"
                + "\"cgpa\":9.10,"
                + "\"backlogs\":0,"
                + "\"placementStatus\":\"PLACED\""
                + "}";

        mockMvc.perform(put("/api/students/202")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Officer student creation validates duplicate ID, duplicate email, and department")
    void officerStudentCreationValidation() throws Exception {
        // Duplicate student ID (101 already exists)
        String dupIdJson = "{"
                + "\"studentId\":101,"
                + "\"name\":\"Duplicate ID\","
                + "\"email\":\"newemail@university.edu\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":7.5,"
                + "\"backlogs\":0"
                + "}";

        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dupIdJson))
                .andExpect(status().isConflict());

        // Duplicate email (student1@university.edu already exists)
        String dupEmailJson = "{"
                + "\"studentId\":205,"
                + "\"name\":\"Duplicate Email\","
                + "\"email\":\"student1@university.edu\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":7.5,"
                + "\"backlogs\":0"
                + "}";

        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dupEmailJson))
                .andExpect(status().isConflict());

        // Non-existent department (999)
        String invalidDeptJson = "{"
                + "\"studentId\":206,"
                + "\"name\":\"Invalid Dept\","
                + "\"email\":\"val@university.edu\","
                + "\"department\":{\"departmentId\":999},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":7.5,"
                + "\"backlogs\":0"
                + "}";

        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidDeptJson))
                .andExpect(status().isBadRequest());

        // Invalid CGPA (> 10.0)
        String invalidCgpaJson = "{"
                + "\"studentId\":207,"
                + "\"name\":\"Invalid CGPA\","
                + "\"email\":\"cgpa@university.edu\","
                + "\"department\":{\"departmentId\":1},"
                + "\"graduationYear\":2025,"
                + "\"cgpa\":11.5,"
                + "\"backlogs\":0"
                + "}";

        mockMvc.perform(post("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidCgpaJson))
                .andExpect(status().isBadRequest());
    }
}

