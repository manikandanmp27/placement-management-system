package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.*;
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

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

    private MockMvc mockMvc;
    private String studentToken;
    private String officerToken;
    private String adminToken;

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

    private Company createCompany(int id, String name) {
        Company company = new Company();
        company.setCompanyId(id);
        company.setCompanyName(name);
        company.setLocation("Bangalore");
        company.setWebsite("https://" + name.toLowerCase() + ".com");
        return companyRepository.save(company);
    }

    private Job createJob(int id, Company company, String title) {
        Job job = new Job();
        job.setJobId(id);
        job.setCompany(company);
        job.setJobTitle(title);
        job.setJobDescription("Engineering role");
        job.setMinCgpa(7.0);
        job.setMaxBacklogs(1);
        job.setDeadline(LocalDate.now().plusDays(30));
        return jobRepository.save(job);
    }

    private Application createApplication(int id, Student student, Job job, String status) {
        Application application = new Application();
        application.setApplicationId(id);
        application.setStudent(student);
        application.setJob(job);
        application.setApplicationDate(LocalDate.now());
        application.setStatus(status);
        return applicationRepository.save(application);
    }

    private Interview createInterview(int id, Application app, int roundNum, String roundType, String result) {
        Interview interview = new Interview();
        interview.setInterviewId(id);
        interview.setApplication(app);
        interview.setRoundNumber(roundNum);
        interview.setRoundType(roundType);
        interview.setInterviewDate(LocalDate.now().plusDays(5));
        interview.setResult(result);
        return interviewRepository.save(interview);
    }

    @Test
    @DisplayName("Student cannot update application status, create or delete applications")
    void studentCannotMutateApplications() throws Exception {
        Company company = createCompany(10, "TechCorp");
        Job job = createJob(10, company, "Frontend Developer");
        Student student = studentRepository.findById(101).orElseThrow();
        createApplication(501, student, job, "APPLIED");

        // Status update
        mockMvc.perform(put("/api/applications/501/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isForbidden());

        // Full application update
        mockMvc.perform(put("/api/applications/501")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":501,\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isForbidden());

        // Create application directly via admin/officer endpoint
        mockMvc.perform(post("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"applicationId\":502}"))
                .andExpect(status().isForbidden());

        // Delete application
        mockMvc.perform(delete("/api/applications/501")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // Student attempt to update SELECTED application to SHORTLISTED
        createApplication(508, student, job, "SELECTED");
        mockMvc.perform(put("/api/applications/508/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student cannot update interview results, schedule or delete interviews")
    void studentCannotMutateInterviews() throws Exception {
        Company company = createCompany(11, "CloudSys");
        Job job = createJob(11, company, "DevOps Engineer");
        Student student = studentRepository.findById(101).orElseThrow();
        Application app = createApplication(502, student, job, "SHORTLISTED");
        createInterview(601, app, 1, "Technical", "Pending");

        // Result update
        mockMvc.perform(put("/api/interviews/601/result")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"Passed\"}"))
                .andExpect(status().isForbidden());

        // Full interview update
        mockMvc.perform(put("/api/interviews/601")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"interviewId\":601,\"result\":\"Passed\"}"))
                .andExpect(status().isForbidden());

        // Schedule interview
        mockMvc.perform(post("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"interviewId\":602}"))
                .andExpect(status().isForbidden());

        // Delete interview
        mockMvc.perform(delete("/api/interviews/601")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Placement Officer can progress application status through valid lifecycle")
    void officerCanProgressApplicationStatus() throws Exception {
        Company company = createCompany(12, "DataWorks");
        Job job = createJob(12, company, "Data Analyst");
        Student student = studentRepository.findById(101).orElseThrow();
        createApplication(503, student, job, "APPLIED");

        // APPLIED -> SHORTLISTED
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHORTLISTED")));

        // SHORTLISTED -> SELECTED
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SELECTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SELECTED")));

        // SELECTED -> SHORTLISTED (Allowed correction when no placement exists)
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SHORTLISTED")));

        // Re-advance SHORTLISTED -> SELECTED
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SELECTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SELECTED")));

        // Invalid: Reverting SELECTED back to APPLIED
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APPLIED\"}"))
                .andExpect(status().isConflict());

        // Invalid: Same status
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SELECTED\"}"))
                .andExpect(status().isBadRequest());

        // Invalid: Unknown status value
        mockMvc.perform(put("/api/applications/503/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ON_HOLD\"}"))
                .andExpect(status().isBadRequest());

        // Non-existent application
        mockMvc.perform(put("/api/applications/99999/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Cannot modify SELECTED application if placement record already exists")
    void cannotModifySelectedApplicationWithExistingPlacement() throws Exception {
        Company company = createCompany(13, "SecOps");
        Job job = createJob(13, company, "Security Engineer");
        Student student = studentRepository.findById(101).orElseThrow();
        createApplication(504, student, job, "SELECTED");

        Placement placement = new Placement();
        placement.setPlacementId(901);
        placement.setStudent(student);
        placement.setCompany(company);
        placement.setJob(job);
        placement.setPlacementDate(LocalDate.now());
        placement.setPackageAmount(1200000.0);
        placementRepository.save(placement);

        // Attempting to change status of placed application to SHORTLISTED is blocked
        mockMvc.perform(put("/api/applications/504/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHORTLISTED\"}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("Cannot change status of an application that already has a finalized placement offer"));

        // Attempting to change status of placed application to REJECTED is blocked
        mockMvc.perform(put("/api/applications/504/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REJECTED\"}"))
                .andExpect(status().isConflict())
                .andExpect(content().string("Cannot change status of an application that already has a finalized placement offer"));
    }

    @Test
    @DisplayName("Placement Officer and Admin can update interview results and outcomes")
    void officerCanUpdateInterviewResult() throws Exception {
        Company company = createCompany(14, "FinTech");
        Job job = createJob(14, company, "Backend Engineer");
        Student student = studentRepository.findById(101).orElseThrow();
        Application app = createApplication(505, student, job, "SHORTLISTED");
        createInterview(602, app, 1, "Technical", "Pending");

        // Officer updates result to Passed
        mockMvc.perform(put("/api/interviews/602/result")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"Passed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result", is("Passed")));

        // Admin updates result to Failed (case-insensitive test)
        mockMvc.perform(put("/api/interviews/602/result")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"failed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result", is("Failed")));

        // Invalid result value
        mockMvc.perform(put("/api/interviews/602/result")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"UNKNOWN\"}"))
                .andExpect(status().isBadRequest());

        // Non-existent interview ID
        mockMvc.perform(put("/api/interviews/99999/result")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"result\":\"Passed\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Student can view only their own applications and interviews, not others")
    void studentCanViewOnlyOwnApplicationsAndInterviews() throws Exception {
        Company company = createCompany(15, "AI Corp");
        Job job = createJob(15, company, "ML Engineer");

        Student student1 = studentRepository.findById(101).orElseThrow();

        Department dept = departmentRepository.findById(1).orElseThrow();
        Student student2 = new Student();
        student2.setStudentId(102);
        student2.setName("Student Two");
        student2.setEmail("student2@university.edu");
        student2.setDepartment(dept);
        student2.setGraduationYear(2025);
        student2.setCgpa(8.0);
        student2.setBacklogs(0);
        student2.setPlacementStatus("NOT_PLACED");
        student2 = studentRepository.save(student2);

        Application app1 = createApplication(506, student1, job, "APPLIED");
        Application app2 = createApplication(507, student2, job, "APPLIED");

        createInterview(603, app1, 1, "Technical", "Pending");
        createInterview(604, app2, 1, "Technical", "Pending");

        // Student 1 lists applications: should only contain app1
        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].applicationId", is(506)));

        // Student 1 tries to access student 2's application directly
        mockMvc.perform(get("/api/applications/507")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // Student 1 lists interviews: should only contain int1
        mockMvc.perform(get("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].interviewId", is(603)));

        // Student 1 tries to access student 2's interview directly
        mockMvc.perform(get("/api/interviews/604")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }
}

