package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Department;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.*;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class DepartmentManagementIntegrationTest {

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
    private String adminToken;
    private String officerToken;
    private String studentToken;
    private Department cseDept;
    private Department eceDept;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        appUserRepository.deleteAll();
        studentRepository.deleteAll();
        departmentRepository.deleteAll();

        // Seed 2 initial departments
        cseDept = new Department();
        cseDept.setDepartmentId(1);
        cseDept.setDepartmentName("Computer Science");
        cseDept = departmentRepository.save(cseDept);

        eceDept = new Department();
        eceDept.setDepartmentId(2);
        eceDept.setDepartmentName("Electronics");
        eceDept = departmentRepository.save(eceDept);

        // Seed Admin user
        AppUser admin = new AppUser("admin@dept.test", passwordEncoder.encode("AdminPass123!"), Role.ROLE_ADMIN, null);
        admin.setEnabled(true);
        admin = appUserRepository.save(admin);
        adminToken = jwtService.generateToken(admin.getEmail(), admin.getUserId(), admin.getRole(), null);

        // Seed Officer user
        AppUser officer = new AppUser("officer@dept.test", passwordEncoder.encode("OfficerPass123!"), Role.ROLE_PLACEMENT_OFFICER, null);
        officer.setEnabled(true);
        officer = appUserRepository.save(officer);
        officerToken = jwtService.generateToken(officer.getEmail(), officer.getUserId(), officer.getRole(), null);

        // Seed Student with enrolled department CSE
        Student student = new Student();
        student.setStudentId(101);
        student.setName("Test Student");
        student.setEmail("student@dept.test");
        student.setDepartment(cseDept);
        student.setGraduationYear(2025);
        student.setCgpa(8.5);
        student.setBacklogs(0);
        student.setPlacementStatus("NOT_PLACED");
        student.setIsArchived(false);
        student = studentRepository.save(student);

        AppUser studentUser = new AppUser("student@dept.test", passwordEncoder.encode("StudentPass123!"), Role.ROLE_STUDENT, student);
        studentUser.setEnabled(true);
        studentUser = appUserRepository.save(studentUser);
        studentToken = jwtService.generateToken(studentUser.getEmail(), studentUser.getUserId(), studentUser.getRole(), student.getStudentId());
    }

    @Test
    @DisplayName("Placement officer can list all departments")
    void officerCanListDepartments() throws Exception {
        mockMvc.perform(get("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].departmentName", is("Computer Science")))
                .andExpect(jsonPath("$[1].departmentName", is("Electronics")));
    }

    @Test
    @DisplayName("Admin can list all departments")
    void adminCanListDepartments() throws Exception {
        mockMvc.perform(get("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Student can view department list (read-only for application eligibility)")
    void studentCanListDepartments() throws Exception {
        mockMvc.perform(get("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Unauthenticated caller cannot list departments (401 Unauthorized)")
    void unauthenticatedCannotListDepartments() throws Exception {
        mockMvc.perform(get("/api/departments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Placement officer can create department with auto-assigned ID")
    void officerCanCreateDepartmentWithAutoId() throws Exception {
        String json = """
                {
                    "departmentName": "Mechanical Engineering"
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.departmentId", is(3)))
                .andExpect(jsonPath("$.departmentName", is("Mechanical Engineering")));

        assertTrue(departmentRepository.existsByDepartmentNameIgnoreCase("Mechanical Engineering"));
    }

    @Test
    @DisplayName("Admin can create department with explicit positive ID")
    void adminCanCreateDepartmentWithExplicitId() throws Exception {
        String json = """
                {
                    "departmentId": 10,
                    "departmentName": "Civil Engineering"
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.departmentId", is(10)))
                .andExpect(jsonPath("$.departmentName", is("Civil Engineering")));

        assertTrue(departmentRepository.existsById(10));
    }

    @Test
    @DisplayName("Student cannot create department (403 Forbidden)")
    void studentCannotCreateDepartment() throws Exception {
        String json = """
                {
                    "departmentName": "Unauthorized Dept"
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Create department rejects duplicate name (case-insensitive) with 409 Conflict")
    void createDepartment_DuplicateName_Conflict409() throws Exception {
        String json = """
                {
                    "departmentName": "computer science"
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already exists")));
    }

    @Test
    @DisplayName("Create department rejects duplicate ID with 409 Conflict")
    void createDepartment_DuplicateId_Conflict409() throws Exception {
        String json = """
                {
                    "departmentId": 1,
                    "departmentName": "Unique Dept Name"
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already exists")));
    }

    @Test
    @DisplayName("Create department rejects blank or empty name with 400 Bad Request")
    void createDepartment_BlankName_BadRequest400() throws Exception {
        String json = """
                {
                    "departmentName": "   "
                }
                """;

        mockMvc.perform(post("/api/departments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("required")));
    }

    @Test
    @DisplayName("Placement officer can update department name")
    void officerCanUpdateDepartmentName() throws Exception {
        String json = """
                {
                    "departmentName": "Electronics & Communication"
                }
                """;

        mockMvc.perform(put("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentId", is(eceDept.getDepartmentId())))
                .andExpect(jsonPath("$.departmentName", is("Electronics & Communication")));

        Department updated = departmentRepository.findById(eceDept.getDepartmentId()).orElseThrow();
        assertTrue(updated.getDepartmentName().equals("Electronics & Communication"));
    }

    @Test
    @DisplayName("Admin can update department name")
    void adminCanUpdateDepartmentName() throws Exception {
        String json = """
                {
                    "departmentName": "Electronics & Telecom"
                }
                """;

        mockMvc.perform(put("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentName", is("Electronics & Telecom")));
    }

    @Test
    @DisplayName("Student cannot update department (403 Forbidden)")
    void studentCannotUpdateDepartment() throws Exception {
        String json = """
                {
                    "departmentName": "Hacked Name"
                }
                """;

        mockMvc.perform(put("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Update department rejects duplicate name conflicting with another department with 409 Conflict")
    void updateDepartment_DuplicateName_Conflict409() throws Exception {
        // Attempt to rename ECE (ID 2) to "Computer Science" (already taken by ID 1)
        String json = """
                {
                    "departmentName": "Computer Science"
                }
                """;

        mockMvc.perform(put("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already exists")));
    }

    @Test
    @DisplayName("Update non-existent department returns 404 Not Found")
    void updateDepartment_NotFound404() throws Exception {
        String json = """
                {
                    "departmentName": "Non-existent Dept"
                }
                """;

        mockMvc.perform(put("/api/departments/999")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Placement officer can delete unreferenced department")
    void officerCanDeleteUnreferencedDepartment() throws Exception {
        // ECE (ID 2) has 0 enrolled students
        mockMvc.perform(delete("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        assertFalse(departmentRepository.existsById(eceDept.getDepartmentId()));
    }

    @Test
    @DisplayName("Deleting department referenced by students is blocked with 409 Conflict and retention recommendation")
    void deleteDepartment_WhenReferencedByStudents_Conflict409() throws Exception {
        // CSE (ID 1) is assigned to student 101
        mockMvc.perform(delete("/api/departments/" + cseDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("referenced by 1 student record(s)")))
                .andExpect(content().string(containsString("Retain the department")));

        assertTrue(departmentRepository.existsById(cseDept.getDepartmentId()));
    }

    @Test
    @DisplayName("Student cannot delete department (403 Forbidden)")
    void studentCannotDeleteDepartment() throws Exception {
        mockMvc.perform(delete("/api/departments/" + eceDept.getDepartmentId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated caller cannot create, update, or delete department (401 Unauthorized)")
    void unauthenticatedCannotMutateDepartments() throws Exception {
        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\": \"Test\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/departments/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"departmentName\": \"Test\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/departments/1"))
                .andExpect(status().isUnauthorized());
    }
}
