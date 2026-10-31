package com.example.placement_management_system.security;

import com.example.placement_management_system.dto.AuthRequest;
import com.example.placement_management_system.dto.RegisterStudentRequest;
import com.example.placement_management_system.entity.*;
import com.example.placement_management_system.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class StudentArchiveIntegrationTest {

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
    private CompanyRepository companyRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private PlacementRepository placementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;
    private String studentToken;
    private String officerToken;
    private String adminToken;

    private Department dept;
    private Student activeStudent;
    private Student freshStudent;
    private AppUser studentUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        interviewRepository.deleteAll();
        placementRepository.deleteAll();
        applicationRepository.deleteAll();
        jobRepository.deleteAll();
        companyRepository.deleteAll();
        appUserRepository.deleteAll();
        studentRepository.deleteAll();
        departmentRepository.deleteAll();

        dept = new Department();
        dept.setDepartmentId(1);
        dept.setDepartmentName("Computer Science");
        dept = departmentRepository.save(dept);

        activeStudent = new Student();
        activeStudent.setStudentId(101);
        activeStudent.setName("Alice Active");
        activeStudent.setEmail("alice@university.edu");
        activeStudent.setDepartment(dept);
        activeStudent.setGraduationYear(2026);
        activeStudent.setCgpa(8.5);
        activeStudent.setBacklogs(0);
        activeStudent.setPlacementStatus("NOT_PLACED");
        activeStudent.setIsArchived(false);
        activeStudent = studentRepository.save(activeStudent);

        freshStudent = new Student();
        freshStudent.setStudentId(102);
        freshStudent.setName("Bob Fresh");
        freshStudent.setEmail("bob@university.edu");
        freshStudent.setDepartment(dept);
        freshStudent.setGraduationYear(2026);
        freshStudent.setCgpa(7.8);
        freshStudent.setBacklogs(0);
        freshStudent.setPlacementStatus("NOT_PLACED");
        freshStudent.setIsArchived(false);
        freshStudent = studentRepository.save(freshStudent);

        studentUser = new AppUser(
                "alice@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                activeStudent
        );
        studentUser.setEnabled(true);
        studentUser = appUserRepository.save(studentUser);

        AppUser officerUser = new AppUser(
                "officer@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_PLACEMENT_OFFICER,
                null
        );
        officerUser.setEnabled(true);
        officerUser = appUserRepository.save(officerUser);

        AppUser adminUser = new AppUser(
                "admin@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_ADMIN,
                null
        );
        adminUser.setEnabled(true);
        adminUser = appUserRepository.save(adminUser);

        studentToken = jwtService.generateToken(studentUser.getEmail(), studentUser.getUserId(), Role.ROLE_STUDENT, 101);
        officerToken = jwtService.generateToken(officerUser.getEmail(), officerUser.getUserId(), Role.ROLE_PLACEMENT_OFFICER, null);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getUserId(), Role.ROLE_ADMIN, null);
    }

    // =========================================================================
    // 1. Authorization Tests
    // =========================================================================

    @Test
    @DisplayName("ROLE_STUDENT cannot archive any student (HTTP 403)")
    void studentCannotArchiveStudent() throws Exception {
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ROLE_STUDENT cannot unarchive any student (HTTP 403)")
    void studentCannotUnarchiveStudent() throws Exception {
        mockMvc.perform(put("/api/students/101/unarchive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request cannot archive a student (HTTP 401)")
    void unauthenticatedCannotArchiveStudent() throws Exception {
        mockMvc.perform(put("/api/students/101/archive"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ROLE_PLACEMENT_OFFICER can archive an active student (HTTP 200)")
    void officerCanArchiveStudent() throws Exception {
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.isArchived").value(true));

        Student updated = studentRepository.findById(101).orElseThrow();
        assertTrue(updated.isArchived());
    }

    @Test
    @DisplayName("ROLE_ADMIN can archive an active student (HTTP 200)")
    void adminCanArchiveStudent() throws Exception {
        mockMvc.perform(put("/api/students/102/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value(102))
                .andExpect(jsonPath("$.isArchived").value(true));

        Student updated = studentRepository.findById(102).orElseThrow();
        assertTrue(updated.isArchived());
    }

    // =========================================================================
    // 2. Archive Behavior & User Account Disabling
    // =========================================================================

    @Test
    @DisplayName("Archiving disables student AppUser login safely without deleting user record")
    void archiveStudentSafelyDisablesUserAccount() throws Exception {
        assertTrue(studentUser.isEnabled());

        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        AppUser reloadedUser = appUserRepository.findByStudent_StudentId(101).orElseThrow();
        assertFalse(reloadedUser.isEnabled(), "User account should be disabled upon student archive");
        assertNotNull(reloadedUser.getPasswordHash(), "Password hash should be preserved");
        assertEquals("alice@university.edu", reloadedUser.getEmail(), "Email should be preserved");
    }

    @Test
    @DisplayName("Archiving an already archived student fails with 409 Conflict")
    void archiveAlreadyArchivedStudentFailsWithConflict() throws Exception {
        // First archive
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Second archive attempt
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("already archived")));
    }

    @Test
    @DisplayName("Archiving non-existent student returns 404 Not Found")
    void archiveNonExistentStudentReturnsNotFound() throws Exception {
        mockMvc.perform(put("/api/students/999/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Unarchiving restores student and re-enables linked user account")
    void unarchiveRestoresStudentAndUserAccount() throws Exception {
        // Archive
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Unarchive
        mockMvc.perform(put("/api/students/101/unarchive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isArchived").value(false));

        Student student = studentRepository.findById(101).orElseThrow();
        assertFalse(student.isArchived());

        AppUser user = appUserRepository.findByStudent_StudentId(101).orElseThrow();
        assertTrue(user.isEnabled());
    }

    @Test
    @DisplayName("Unarchiving a non-archived student fails with 409 Conflict")
    void unarchiveNonArchivedStudentFails() throws Exception {
        mockMvc.perform(put("/api/students/101/unarchive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("is not archived")));
    }

    // =========================================================================
    // 3. Exclusion from Active Student Lists by Default
    // =========================================================================

    @Test
    @DisplayName("Archived students are excluded from GET /api/students by default")
    void archivedStudentsExcludedFromDefaultList() throws Exception {
        // Initially 2 active students
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Archive student 101
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Default query: only active (student 102)
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentId").value(102));

        // Explicit query includeArchived=true: returns both (student 101 and 102)
        mockMvc.perform(get("/api/students?includeArchived=true")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Explicit query archived=true: returns only student 101
        mockMvc.perform(get("/api/students?archived=true")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentId").value(101));

        // Explicit query archived=false: returns only student 102
        mockMvc.perform(get("/api/students?archived=false")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentId").value(102));
    }

    // =========================================================================
    // 4. Historical Record Preservation
    // =========================================================================

    @Test
    @DisplayName("Historical applications, interviews, and placements remain intact after student is archived")
    void historicalRecordsPreservedWhenStudentArchived() throws Exception {
        Company comp = new Company();
        comp.setCompanyId(10);
        comp.setCompanyName("Google Cloud");
        comp = companyRepository.save(comp);

        Job job = new Job();
        job.setJobId(20);
        job.setCompany(comp);
        job.setJobTitle("Software Engineer");
        job.setDeadline(LocalDate.now().plusMonths(1));
        job = jobRepository.save(job);

        Application app = new Application();
        app.setApplicationId(30);
        app.setStudent(activeStudent);
        app.setJob(job);
        app.setApplicationDate(LocalDate.now().minusDays(5));
        app.setStatus("SHORTLISTED");
        app = applicationRepository.save(app);

        Interview interview = new Interview();
        interview.setInterviewId(40);
        interview.setApplication(app);
        interview.setRoundNumber(1);
        interview.setRoundType("Technical");
        interview.setResult("Passed");
        interview.setInterviewDate(LocalDate.now().minusDays(2));
        interview = interviewRepository.save(interview);

        Placement placement = new Placement();
        placement.setPlacementId(50);
        placement.setStudent(activeStudent);
        placement.setCompany(comp);
        placement.setJob(job);
        placement.setPlacementDate(LocalDate.now().minusDays(1));
        placement.setPackageAmount(1200000.0);
        placement = placementRepository.save(placement);

        // Archive student 101
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // 1. Applications still present with student reference
        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].student.studentId").value(101))
                .andExpect(jsonPath("$[0].student.name").value("Alice Active"));

        // 2. Interviews still present
        mockMvc.perform(get("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].application.student.studentId").value(101));

        // 3. Placements still present
        mockMvc.perform(get("/api/placements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].student.studentId").value(101));

        // 4. Student profile remains retrievable by ID
        mockMvc.perform(get("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.isArchived").value(true));
    }

    // =========================================================================
    // 5. Blocked Login, Registration, and Application Behavior
    // =========================================================================

    @Test
    @DisplayName("Archived student's existing login is rejected with HTTP 403 Forbidden (Account Disabled)")
    void blockedLoginForArchivedStudent() throws Exception {
        // Archive student
        mockMvc.perform(put("/api/students/101/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Attempt login
        AuthRequest loginRequest = new AuthRequest("alice@university.edu", "Password123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("Account is disabled")));
    }

    @Test
    @DisplayName("Self-registration is rejected for an archived student record with HTTP 409 Conflict")
    void blockedRegistrationForArchivedStudent() throws Exception {
        // Archive freshStudent (ID 102, has no AppUser account yet)
        mockMvc.perform(put("/api/students/102/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        RegisterStudentRequest regRequest = new RegisterStudentRequest(
                102,
                "bob@university.edu",
                "NewPassword123!"
        );

        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("Archived student records are not eligible to register")));
    }

    @Test
    @DisplayName("Job application is rejected for an archived student with HTTP 409 Conflict")
    void blockedJobApplicationForArchivedStudent() throws Exception {
        Company comp = new Company();
        comp.setCompanyId(10);
        comp.setCompanyName("Amazon");
        comp = companyRepository.save(comp);

        Job job = new Job();
        job.setJobId(20);
        job.setCompany(comp);
        job.setJobTitle("SDE I");
        job.setDeadline(LocalDate.now().plusMonths(1));
        job = jobRepository.save(job);

        // Archive student 102
        mockMvc.perform(put("/api/students/102/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Officer attempting to submit application for archived student 102
        mockMvc.perform(post("/api/procedures/apply?studentId=102&jobId=20")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("Archived students are not eligible to apply for jobs.")));
    }

    // =========================================================================
    // 6. Deletion Safety Rules (Preserving Records & Permitting Safe Clean Delete)
    // =========================================================================

    @Test
    @DisplayName("DELETE fails with HTTP 409 Conflict when student has an existing user account or applications")
    void deleteStudentWithReferencesFailsWithConflict() throws Exception {
        // activeStudent (ID 101) has an AppUser account
        mockMvc.perform(delete("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("Cannot delete student with associated applications, placements, or user accounts. Please archive")));

        // Verify student still exists
        assertTrue(studentRepository.existsById(101));
    }

    @Test
    @DisplayName("DELETE succeeds for a fresh student without any applications, placements, or user accounts")
    void deleteFreshStudentWithoutReferencesSucceeds() throws Exception {
        // freshStudent (ID 102) has no AppUser, no applications, no placements
        mockMvc.perform(delete("/api/students/102")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk());

        // Verify student was deleted cleanly
        assertFalse(studentRepository.existsById(102));
    }
}
