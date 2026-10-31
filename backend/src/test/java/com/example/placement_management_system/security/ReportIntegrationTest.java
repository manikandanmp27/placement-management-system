package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.*;
import com.example.placement_management_system.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class ReportIntegrationTest {

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
    private String adminToken;
    private String officerToken;
    private String studentToken;

    private Department cseDept;
    private Department eceDept;
    private Company techCorp;
    private Company innovaInc;

    private Student student1;
    private Student student2;
    private Student student3;
    private Student student4Archived;

    private Job job1;
    private Job job2;
    private Job job3ZeroApps;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        // Clean tables in reverse dependency order
        placementRepository.deleteAll();
        interviewRepository.deleteAll();
        applicationRepository.deleteAll();
        appUserRepository.deleteAll();
        studentRepository.deleteAll();
        jobRepository.deleteAll();
        companyRepository.deleteAll();
        departmentRepository.deleteAll();

        // Seed departments
        cseDept = new Department();
        cseDept.setDepartmentId(1);
        cseDept.setDepartmentName("Computer Science");
        cseDept = departmentRepository.save(cseDept);

        eceDept = new Department();
        eceDept.setDepartmentId(2);
        eceDept.setDepartmentName("Electronics");
        eceDept = departmentRepository.save(eceDept);

        // Seed companies
        techCorp = new Company();
        techCorp.setCompanyId(10);
        techCorp.setCompanyName("TechCorp Global");
        techCorp.setLocation("Bengaluru");
        techCorp.setIndustry("Technology");
        techCorp = companyRepository.save(techCorp);

        innovaInc = new Company();
        innovaInc.setCompanyId(20);
        innovaInc.setCompanyName("Innova Solutions");
        innovaInc.setLocation("Hyderabad");
        innovaInc.setIndustry("Fintech");
        innovaInc = companyRepository.save(innovaInc);

        // Seed jobs
        job1 = new Job();
        job1.setJobId(101);
        job1.setCompany(techCorp);
        job1.setJobTitle("Software Engineer");
        job1.setJobType("Full-Time");
        job1.setPackageAmount(12.5);
        job1.setMinCgpa(7.5);
        job1.setMaxBacklogs(0);
        job1.setDeadline(LocalDate.now().plusDays(30));
        job1 = jobRepository.save(job1);

        job2 = new Job();
        job2.setJobId(102);
        job2.setCompany(innovaInc);
        job2.setJobTitle("Data Analyst");
        job2.setJobType("Full-Time");
        job2.setPackageAmount(9.0);
        job2.setMinCgpa(7.0);
        job2.setMaxBacklogs(1);
        job2.setDeadline(LocalDate.now().plusDays(15));
        job2 = jobRepository.save(job2);

        job3ZeroApps = new Job();
        job3ZeroApps.setJobId(103);
        job3ZeroApps.setCompany(techCorp);
        job3ZeroApps.setJobTitle("Cloud Architect");
        job3ZeroApps.setJobType("Full-Time");
        job3ZeroApps.setPackageAmount(18.0);
        job3ZeroApps.setMinCgpa(8.5);
        job3ZeroApps.setMaxBacklogs(0);
        job3ZeroApps.setDeadline(LocalDate.now().plusDays(45));
        job3ZeroApps = jobRepository.save(job3ZeroApps);

        // Seed students
        student1 = new Student();
        student1.setStudentId(1001);
        student1.setName("Alice Sharma");
        student1.setEmail("alice@campus.edu");
        student1.setDepartment(cseDept);
        student1.setGraduationYear(2026);
        student1.setCgpa(8.8);
        student1.setBacklogs(0);
        student1.setPlacementStatus("NOT_PLACED");
        student1.setIsArchived(false);
        student1 = studentRepository.save(student1);

        student2 = new Student();
        student2.setStudentId(1002);
        student2.setName("Bob Kumar");
        student2.setEmail("bob@campus.edu");
        student2.setDepartment(eceDept);
        student2.setGraduationYear(2026);
        student2.setCgpa(7.9);
        student2.setBacklogs(0);
        student2.setPlacementStatus("NOT_PLACED");
        student2.setIsArchived(false);
        student2 = studentRepository.save(student2);

        student3 = new Student();
        student3.setStudentId(1003);
        student3.setName("Charlie Verma");
        student3.setEmail("charlie@campus.edu");
        student3.setDepartment(cseDept);
        student3.setGraduationYear(2026);
        student3.setCgpa(8.2);
        student3.setBacklogs(0);
        student3.setPlacementStatus("NOT_PLACED");
        student3.setIsArchived(false);
        student3 = studentRepository.save(student3);

        student4Archived = new Student();
        student4Archived.setStudentId(1004);
        student4Archived.setName("David Former");
        student4Archived.setEmail("david.archived@campus.edu");
        student4Archived.setDepartment(eceDept);
        student4Archived.setGraduationYear(2025);
        student4Archived.setCgpa(6.5);
        student4Archived.setBacklogs(2);
        student4Archived.setPlacementStatus("NOT_PLACED");
        student4Archived.setIsArchived(true);
        student4Archived = studentRepository.save(student4Archived);

        // Seed Auth Users
        AppUser adminUser = new AppUser();
        adminUser.setEmail("admin@campus.edu");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        adminUser.setRole(Role.ROLE_ADMIN);
        adminUser.setEnabled(true);
        adminUser = appUserRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser.getEmail(), adminUser.getUserId(), adminUser.getRole(), null);

        AppUser officerUser = new AppUser();
        officerUser.setEmail("officer@campus.edu");
        officerUser.setPasswordHash(passwordEncoder.encode("OfficerPass123!"));
        officerUser.setRole(Role.ROLE_PLACEMENT_OFFICER);
        officerUser.setEnabled(true);
        officerUser = appUserRepository.save(officerUser);
        officerToken = jwtService.generateToken(officerUser.getEmail(), officerUser.getUserId(), officerUser.getRole(), null);

        AppUser studentUser = new AppUser();
        studentUser.setEmail("alice@campus.edu");
        studentUser.setPasswordHash(passwordEncoder.encode("StudentPass123!"));
        studentUser.setRole(Role.ROLE_STUDENT);
        studentUser.setStudent(student1);
        studentUser.setEnabled(true);
        studentUser = appUserRepository.save(studentUser);
        studentToken = jwtService.generateToken(studentUser.getEmail(), studentUser.getUserId(), studentUser.getRole(), student1.getStudentId());
    }

    // =========================================================================
    // Role Authorization Tests
    // =========================================================================

    @Test
    @DisplayName("Officer and Admin can access all report endpoints; 200 OK")
    void officerAndAdmin_canAccessAllReportEndpoints() throws Exception {
        for (String token : new String[]{officerToken, adminToken}) {
            mockMvc.perform(get("/api/reports/unapplied-students")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/reports/jobs-by-applicants")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/reports/students-in-interview-process")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isOk());

            mockMvc.perform(get("/api/reports/summary")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Student is denied access to report endpoints; 403 Forbidden")
    void student_isDeniedAccessToReportEndpoints() throws Exception {
        mockMvc.perform(get("/api/reports/unapplied-students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reports/jobs-by-applicants")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reports/students-in-interview-process")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reports/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to reports is rejected; 401 Unauthorized")
    void unauthenticated_isDeniedAccessToReportEndpoints() throws Exception {
        mockMvc.perform(get("/api/reports/unapplied-students"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reports/jobs-by-applicants"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reports/students-in-interview-process"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // Report 1: Students with no applications
    // =========================================================================

    @Test
    @DisplayName("Report 1: Returns only students who have not applied to any job")
    void report1_unappliedStudents_returnsOnlyUnapplied() throws Exception {
        // Create an application for student1
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("APPLIED");
        applicationRepository.save(app1);

        // When includeArchived is false (default):
        // student1 has applied -> excluded
        // student2 has NOT applied -> included
        // student3 has NOT applied -> included
        // student4 is archived -> excluded by default
        mockMvc.perform(get("/api/reports/unapplied-students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].studentId", is(student2.getStudentId())))
                .andExpect(jsonPath("$[0].name", is("Bob Kumar")))
                .andExpect(jsonPath("$[0].departmentName", is("Electronics")))
                .andExpect(jsonPath("$[1].studentId", is(student3.getStudentId())))
                .andExpect(jsonPath("$[1].name", is("Charlie Verma")))
                .andExpect(jsonPath("$[1].departmentName", is("Computer Science")));
    }

    @Test
    @DisplayName("Report 1: Edge case - Student with multiple applications is correctly excluded")
    void report1_unappliedStudents_multipleApplicationsStudentIsExcluded() throws Exception {
        // student1 applies to Job 1 AND Job 2
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("APPLIED");
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student1);
        app2.setJob(job2);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("SHORTLISTED");
        applicationRepository.save(app2);

        // student1 must not appear in unapplied students report
        mockMvc.perform(get("/api/reports/unapplied-students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].studentId", not(hasItem(student1.getStudentId()))));
    }

    @Test
    @DisplayName("Report 1: Archived student filtering via includeArchived parameter")
    void report1_unappliedStudents_archivedStudentFiltering() throws Exception {
        // When includeArchived=true, student4Archived should be included
        mockMvc.perform(get("/api/reports/unapplied-students")
                        .param("includeArchived", "true")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[*].studentId", hasItem(student4Archived.getStudentId())));

        // When includeArchived=false, student4Archived should be excluded
        mockMvc.perform(get("/api/reports/unapplied-students")
                        .param("includeArchived", "false")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].studentId", not(hasItem(student4Archived.getStudentId()))));
    }

    @Test
    @DisplayName("Report 1: When all active students have applied, returns empty list; 200 OK")
    void report1_unappliedStudents_emptyResultHandling() throws Exception {
        // Create applications for student1, student2, and student3
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("APPLIED");
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student2);
        app2.setJob(job1);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("APPLIED");
        applicationRepository.save(app2);

        Application app3 = new Application();
        app3.setApplicationId(503);
        app3.setStudent(student3);
        app3.setJob(job2);
        app3.setApplicationDate(LocalDate.now());
        app3.setStatus("APPLIED");
        applicationRepository.save(app3);

        mockMvc.perform(get("/api/reports/unapplied-students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // =========================================================================
    // Report 2: Jobs ranked by applicant count
    // =========================================================================

    @Test
    @DisplayName("Report 2: Returns jobs ranked by applicant count descending, including 0 applicants")
    void report2_jobsRankedByApplicantCount_orderedHighestFirst() throws Exception {
        // job1 has 2 applicants (student1, student2)
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("APPLIED");
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student2);
        app2.setJob(job1);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("SHORTLISTED");
        applicationRepository.save(app2);

        // job2 has 1 applicant (student3)
        Application app3 = new Application();
        app3.setApplicationId(503);
        app3.setStudent(student3);
        app3.setJob(job2);
        app3.setApplicationDate(LocalDate.now());
        app3.setStatus("APPLIED");
        applicationRepository.save(app3);

        // job3ZeroApps has 0 applicants

        mockMvc.perform(get("/api/reports/jobs-by-applicants")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                // Rank 1: job1 with 2 applicants
                .andExpect(jsonPath("$[0].jobId", is(job1.getJobId())))
                .andExpect(jsonPath("$[0].jobTitle", is("Software Engineer")))
                .andExpect(jsonPath("$[0].companyName", is("TechCorp Global")))
                .andExpect(jsonPath("$[0].applicantCount", is(2)))
                // Rank 2: job2 with 1 applicant
                .andExpect(jsonPath("$[1].jobId", is(job2.getJobId())))
                .andExpect(jsonPath("$[1].jobTitle", is("Data Analyst")))
                .andExpect(jsonPath("$[1].applicantCount", is(1)))
                // Rank 3: job3 with 0 applicants
                .andExpect(jsonPath("$[2].jobId", is(job3ZeroApps.getJobId())))
                .andExpect(jsonPath("$[2].jobTitle", is("Cloud Architect")))
                .andExpect(jsonPath("$[2].applicantCount", is(0)));
    }

    // =========================================================================
    // Report 3: Students currently in the interview process
    // =========================================================================

    @Test
    @DisplayName("Report 3: Identifies students with active pending interviews and shortlisted status")
    void report3_studentsInInterviewProcess_pipelineTracking() throws Exception {
        // Application 1 for student1: SHORTLISTED with Pending interview round
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("SHORTLISTED");
        applicationRepository.save(app1);

        Interview int1 = new Interview();
        int1.setInterviewId(901);
        int1.setApplication(app1);
        int1.setRoundNumber(1);
        int1.setRoundType("Technical");
        int1.setInterviewDate(LocalDate.now().plusDays(2));
        int1.setResult("Pending");
        interviewRepository.save(int1);

        // Application 2 for student2: SHORTLISTED (awaiting interview scheduling, interview is null)
        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student2);
        app2.setJob(job2);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("SHORTLISTED");
        applicationRepository.save(app2);

        // Application 3 for student3: APPLIED only (not shortlisted, no interview) -> must be excluded
        Application app3 = new Application();
        app3.setApplicationId(503);
        app3.setStudent(student3);
        app3.setJob(job1);
        app3.setApplicationDate(LocalDate.now());
        app3.setStatus("APPLIED");
        applicationRepository.save(app3);

        mockMvc.perform(get("/api/reports/students-in-interview-process")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                // Student 1: with interview details
                .andExpect(jsonPath("$[*].studentId", hasItem(student1.getStudentId())))
                .andExpect(jsonPath("$[*].jobTitle", hasItem("Software Engineer")))
                .andExpect(jsonPath("$[*].roundType", hasItem("Technical")))
                .andExpect(jsonPath("$[*].interviewResult", hasItem("Pending")))
                // Student 2: shortlisted awaiting scheduling
                .andExpect(jsonPath("$[*].studentId", hasItem(student2.getStudentId())))
                .andExpect(jsonPath("$[*].applicationStatus", hasItem("SHORTLISTED")))
                // Student 3: APPLIED only -> excluded
                .andExpect(jsonPath("$[*].studentId", not(hasItem(student3.getStudentId()))));
    }

    @Test
    @DisplayName("Report 3: Excludes SELECTED and REJECTED applications")
    void report3_studentsInInterviewProcess_excludesSelectedAndRejected() throws Exception {
        // Application 1: SELECTED
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("SELECTED");
        applicationRepository.save(app1);

        // Application 2: REJECTED
        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student2);
        app2.setJob(job2);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("REJECTED");
        applicationRepository.save(app2);

        mockMvc.perform(get("/api/reports/students-in-interview-process")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Report 3: Edge case - Student with multiple applications where only one is in interview pipeline")
    void report3_studentsInInterviewProcess_multipleApplicationsHandledProperly() throws Exception {
        // student1 applied to Job 1 (REJECTED)
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("REJECTED");
        applicationRepository.save(app1);

        // student1 also applied to Job 2 (SHORTLISTED with Pending interview)
        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student1);
        app2.setJob(job2);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("SHORTLISTED");
        applicationRepository.save(app2);

        Interview int2 = new Interview();
        int2.setInterviewId(902);
        int2.setApplication(app2);
        int2.setRoundNumber(1);
        int2.setRoundType("HR Round");
        int2.setInterviewDate(LocalDate.now().plusDays(3));
        int2.setResult("Pending");
        interviewRepository.save(int2);

        // Should return exactly 1 row corresponding to Job 2
        mockMvc.perform(get("/api/reports/students-in-interview-process")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentId", is(student1.getStudentId())))
                .andExpect(jsonPath("$[0].jobId", is(job2.getJobId())))
                .andExpect(jsonPath("$[0].jobTitle", is("Data Analyst")))
                .andExpect(jsonPath("$[0].roundType", is("HR Round")))
                .andExpect(jsonPath("$[0].interviewResult", is("Pending")));
    }

    // =========================================================================
    // Summary Metrics Test
    // =========================================================================

    @Test
    @DisplayName("Report Summary: Correctly aggregates metrics across all entities")
    void reportSummary_correctlyAggregatesTotals() throws Exception {
        // Create 2 applications
        Application app1 = new Application();
        app1.setApplicationId(501);
        app1.setStudent(student1);
        app1.setJob(job1);
        app1.setApplicationDate(LocalDate.now());
        app1.setStatus("SHORTLISTED");
        applicationRepository.save(app1);

        Interview int1 = new Interview();
        int1.setInterviewId(901);
        int1.setApplication(app1);
        int1.setRoundNumber(1);
        int1.setRoundType("Technical");
        int1.setInterviewDate(LocalDate.now().plusDays(1));
        int1.setResult("Pending");
        interviewRepository.save(int1);

        Application app2 = new Application();
        app2.setApplicationId(502);
        app2.setStudent(student2);
        app2.setJob(job2);
        app2.setApplicationDate(LocalDate.now());
        app2.setStatus("APPLIED");
        applicationRepository.save(app2);

        // Total students: 4 (student1, student2, student3, student4Archived)
        // Active unapplied students: 1 (student3; student1 and student2 applied; student4 is archived)
        // Total jobs: 3 (job1, job2, job3ZeroApps)
        // Total applications: 2
        // Active interview pipeline: 1 (app1 is SHORTLISTED with Pending interview)

        mockMvc.perform(get("/api/reports/summary")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents", is(4)))
                .andExpect(jsonPath("$.unappliedStudentsCount", is(1)))
                .andExpect(jsonPath("$.totalJobs", is(3)))
                .andExpect(jsonPath("$.totalApplications", is(2)))
                .andExpect(jsonPath("$.activeInterviewPipelineCount", is(1)));
    }
}
