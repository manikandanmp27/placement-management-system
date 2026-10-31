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
class OfficerManagementIntegrationTest {

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
    private AppUser adminUser;
    private AppUser officerUser;
    private AppUser studentUser;

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
        dept.setDepartmentName("Computer Science");
        dept = departmentRepository.save(dept);

        Student student = new Student();
        student.setStudentId(101);
        student.setName("Alice Student");
        student.setEmail("alice@university.edu");
        student.setDepartment(dept);
        student.setGraduationYear(2025);
        student.setCgpa(8.5);
        student.setBacklogs(0);
        student.setPlacementStatus("NOT_PLACED");
        student.setIsArchived(false);
        student = studentRepository.save(student);

        // Provision admin
        adminUser = new AppUser("admin@university.edu", passwordEncoder.encode("AdminPass123!"), Role.ROLE_ADMIN, null);
        adminUser.setEnabled(true);
        adminUser = appUserRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getUserId(), adminUser.getRole(), null);

        // Provision officer
        officerUser = new AppUser("officer@university.edu", passwordEncoder.encode("OfficerPass123!"), Role.ROLE_PLACEMENT_OFFICER, null);
        officerUser.setEnabled(true);
        officerUser = appUserRepository.save(officerUser);
        officerToken = jwtService.generateToken(officerUser.getEmail(), officerUser.getUserId(), officerUser.getRole(), null);

        // Provision student
        studentUser = new AppUser("alice@university.edu", passwordEncoder.encode("StudentPass123!"), Role.ROLE_STUDENT, student);
        studentUser.setEnabled(true);
        studentUser = appUserRepository.save(studentUser);
        studentToken = jwtService.generateToken(studentUser.getEmail(), studentUser.getUserId(), studentUser.getRole(), student.getStudentId());
    }

    @Test
    @DisplayName("Admin can create a new placement officer account with hashed password and server-assigned role")
    void adminCanCreateOfficerAccount_Success() throws Exception {
        String requestJson = """
                {
                    "email": "new.officer@university.edu",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.email", is("new.officer@university.edu")))
                .andExpect(jsonPath("$.role", is("ROLE_PLACEMENT_OFFICER")))
                .andExpect(jsonPath("$.enabled", is(true)))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        AppUser savedOfficer = appUserRepository.findByEmail("new.officer@university.edu").orElseThrow();
        assertTrue(passwordEncoder.matches("SecurePassword123!", savedOfficer.getPasswordHash()));
        assertFalse(savedOfficer.getPasswordHash().contains("SecurePassword123!"));
        assertTrue(savedOfficer.isEnabled());
    }

    @Test
    @DisplayName("Placement officer caller cannot create another officer account (403 Forbidden)")
    void officerCaller_CannotCreateOfficer_Forbidden() throws Exception {
        String requestJson = """
                {
                    "email": "another.officer@university.edu",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student caller cannot create an officer account (403 Forbidden)")
    void studentCaller_CannotCreateOfficer_Forbidden() throws Exception {
        String requestJson = """
                {
                    "email": "student.try@university.edu",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated caller cannot access officer provisioning (401 Unauthorized)")
    void unauthenticatedCaller_CannotCreateOfficer_Unauthorized() throws Exception {
        String requestJson = """
                {
                    "email": "unauth@university.edu",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Officer creation rejects duplicate email with 409 Conflict")
    void duplicateEmail_RejectsWithConflict409() throws Exception {
        String requestJson = """
                {
                    "email": "officer@university.edu",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already exists")));
    }

    @Test
    @DisplayName("Officer creation rejects invalid email format with 400 Bad Request")
    void invalidEmail_RejectsWithBadRequest400() throws Exception {
        String requestJson = """
                {
                    "email": "not-a-valid-email",
                    "password": "SecurePassword123!"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("email")));
    }

    @Test
    @DisplayName("Officer creation rejects passwords shorter than 8 characters with 400 Bad Request")
    void shortPassword_RejectsWithBadRequest400() throws Exception {
        String requestJson = """
                {
                    "email": "short.pwd@university.edu",
                    "password": "short"
                }
                """;

        mockMvc.perform(post("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Password")));
    }

    @Test
    @DisplayName("Admin can list all placement officer accounts; students and admins are excluded")
    void adminCanListOfficers_ReturnsOnlyOfficers() throws Exception {
        // Create an additional officer
        AppUser officer2 = new AppUser("officer2@university.edu", passwordEncoder.encode("Pass12345!"), Role.ROLE_PLACEMENT_OFFICER, null);
        officer2.setEnabled(true);
        appUserRepository.save(officer2);

        mockMvc.perform(get("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].role", everyItem(is("ROLE_PLACEMENT_OFFICER"))))
                .andExpect(jsonPath("$[*].email", hasItems("officer@university.edu", "officer2@university.edu")))
                .andExpect(jsonPath("$[*].password").doesNotExist())
                .andExpect(jsonPath("$[*].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Officer or student cannot list officer accounts (403 Forbidden)")
    void officerOrStudent_CannotListOfficers_Forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/officers")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin can disable and re-enable an officer account")
    void adminCanEnableAndDisableOfficerAccount() throws Exception {
        // Disable officer
        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(officerUser.getUserId())))
                .andExpect(jsonPath("$.enabled", is(false)));

        AppUser reloadedDisabled = appUserRepository.findById(officerUser.getUserId()).orElseThrow();
        assertFalse(reloadedDisabled.isEnabled());

        // Re-enable officer
        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(officerUser.getUserId())))
                .andExpect(jsonPath("$.enabled", is(true)));

        AppUser reloadedEnabled = appUserRepository.findById(officerUser.getUserId()).orElseThrow();
        assertTrue(reloadedEnabled.isEnabled());
    }

    @Test
    @DisplayName("Disabled officer cannot log in (403 Forbidden - Account is disabled)")
    void disabledOfficer_CannotLogin() throws Exception {
        // Disable officer
        officerUser.setEnabled(false);
        appUserRepository.save(officerUser);

        String loginJson = """
                {
                    "email": "officer@university.edu",
                    "password": "OfficerPass123!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("Account is disabled")));
    }

    @Test
    @DisplayName("Existing JWT for newly disabled officer account is rejected with 401 Unauthorized")
    void existingJwt_ForDisabledOfficer_IsRejectedOnSubsequentRequests() throws Exception {
        // Token is active and valid initially
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Admin disables officer account
        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isOk());

        // Officer attempts subsequent request with pre-existing token
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin can reset officer password; officer can log in with new password and old password is invalidated")
    void adminCanResetOfficerPassword() throws Exception {
        String resetJson = """
                {
                    "newPassword": "BrandNewSecretPassword123!"
                }
                """;

        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/reset-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", is(officerUser.getUserId())))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Old password fails
        String oldLoginJson = """
                {
                    "email": "officer@university.edu",
                    "password": "OfficerPass123!"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oldLoginJson))
                .andExpect(status().isUnauthorized());

        // New password succeeds
        String newLoginJson = """
                {
                    "email": "officer@university.edu",
                    "password": "BrandNewSecretPassword123!"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newLoginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role", is("ROLE_PLACEMENT_OFFICER")));
    }

    @Test
    @DisplayName("Password reset rejects short password (< 8 chars) with 400 Bad Request")
    void resetPassword_ShortPassword_BadRequest400() throws Exception {
        String resetJson = """
                {
                    "newPassword": "short"
                }
                """;

        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/reset-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetJson))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Password")));
    }

    @Test
    @DisplayName("Admin cannot disable or reset own account through officer management endpoints")
    void adminCannotModifyOwnAccountThroughOfficerManagement() throws Exception {
        // Attempt status update on admin's own ID
        mockMvc.perform(put("/api/admin/officers/" + adminUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isBadRequest());

        // Attempt password reset on admin's own ID
        mockMvc.perform(put("/api/admin/officers/" + adminUser.getUserId() + "/reset-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\": \"NewPassword123!\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cannot modify non-officer (e.g. student) account through officer management endpoints")
    void cannotModifyNonOfficerAccountThroughOfficerManagement() throws Exception {
        mockMvc.perform(put("/api/admin/officers/" + studentUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("not a placement officer")));

        mockMvc.perform(put("/api/admin/officers/" + studentUser.getUserId() + "/reset-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\": \"NewPassword123!\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("not a placement officer")));
    }

    @Test
    @DisplayName("Officer or student cannot modify status or reset password of an officer (403 Forbidden)")
    void officerOrStudent_CannotModifyStatusOrPassword_Forbidden() throws Exception {
        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\": false}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/admin/officers/" + officerUser.getUserId() + "/reset-password")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\": \"NewPassword123!\"}"))
                .andExpect(status().isForbidden());
    }
}

