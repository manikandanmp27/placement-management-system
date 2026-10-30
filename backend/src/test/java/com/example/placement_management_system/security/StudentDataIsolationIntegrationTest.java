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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class StudentDataIsolationIntegrationTest {

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
    private Student studentA;
    private Student studentB;
    private String tokenA;
    private String tokenB;
    private String officerToken;
    private Application appA;
    private Application appB;
    private Interview intA;
    private Interview intB;
    private Placement plcA;
    private Placement plcB;

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

        Company comp = new Company();
        comp.setCompanyId(1);
        comp.setCompanyName("Tech Corp");
        comp = companyRepository.save(comp);

        Job job = new Job();
        job.setJobId(1);
        job.setCompany(comp);
        job.setJobTitle("Software Engineer");
        job = jobRepository.save(job);

        // Student A
        studentA = new Student();
        studentA.setStudentId(101);
        studentA.setName("Alice");
        studentA.setEmail("alice@university.edu");
        studentA.setDepartment(dept);
        studentA.setGraduationYear(2025);
        studentA.setCgpa(9.0);
        studentA.setBacklogs(0);
        studentA.setPlacementStatus("NOT_PLACED");
        studentA = studentRepository.save(studentA);

        AppUser userA = new AppUser(
                studentA.getEmail(),
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                studentA);
        userA.setEnabled(true);
        userA = appUserRepository.save(userA);
        tokenA = jwtService.generateToken(userA.getEmail(), userA.getUserId(), userA.getRole(), studentA.getStudentId());

        // Student B
        studentB = new Student();
        studentB.setStudentId(102);
        studentB.setName("Bob");
        studentB.setEmail("bob@university.edu");
        studentB.setDepartment(dept);
        studentB.setGraduationYear(2025);
        studentB.setCgpa(8.0);
        studentB.setBacklogs(0);
        studentB.setPlacementStatus("NOT_PLACED");
        studentB = studentRepository.save(studentB);

        AppUser userB = new AppUser(
                studentB.getEmail(),
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                studentB);
        userB.setEnabled(true);
        userB = appUserRepository.save(userB);
        tokenB = jwtService.generateToken(userB.getEmail(), userB.getUserId(), userB.getRole(), studentB.getStudentId());

        // Placement Officer
        AppUser officer = new AppUser(
                "officer@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_PLACEMENT_OFFICER,
                null);
        officer.setEnabled(true);
        officer = appUserRepository.save(officer);
        officerToken = jwtService.generateToken(officer.getEmail(), officer.getUserId(), officer.getRole(), null);

        // Applications
        appA = new Application();
        appA.setApplicationId(1);
        appA.setStudent(studentA);
        appA.setJob(job);
        appA.setApplicationDate(LocalDate.now());
        appA.setStatus("APPLIED");
        appA = applicationRepository.save(appA);

        appB = new Application();
        appB.setApplicationId(2);
        appB.setStudent(studentB);
        appB.setJob(job);
        appB.setApplicationDate(LocalDate.now());
        appB.setStatus("APPLIED");
        appB = applicationRepository.save(appB);

        // Interviews
        intA = new Interview();
        intA.setInterviewId(1);
        intA.setApplication(appA);
        intA.setRoundNumber(1);
        intA.setRoundType("Technical");
        intA.setInterviewDate(LocalDate.now().plusDays(2));
        intA.setResult("SCHEDULED");
        intA = interviewRepository.save(intA);

        intB = new Interview();
        intB.setInterviewId(2);
        intB.setApplication(appB);
        intB.setRoundNumber(1);
        intB.setRoundType("Technical");
        intB.setInterviewDate(LocalDate.now().plusDays(2));
        intB.setResult("SCHEDULED");
        intB = interviewRepository.save(intB);

        // Placements
        plcA = new Placement();
        plcA.setPlacementId(1);
        plcA.setStudent(studentA);
        plcA.setCompany(comp);
        plcA.setJob(job);
        plcA.setPlacementDate(LocalDate.now());
        plcA.setPackageAmount(1200000.0);
        plcA = placementRepository.save(plcA);

        plcB = new Placement();
        plcB.setPlacementId(2);
        plcB.setStudent(studentB);
        plcB.setCompany(comp);
        plcB.setJob(job);
        plcB.setPlacementDate(LocalDate.now());
        plcB.setPackageAmount(1000000.0);
        plcB = placementRepository.save(plcB);
    }

    @Test
    @DisplayName("Student A can retrieve their own profile but cannot retrieve Student B's profile")
    void studentProfileIsolation() throws Exception {
        mockMvc.perform(get("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"));

        mockMvc.perform(get("/api/students/102")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student A retrieves only their own applications in list and cannot access Student B's application by ID")
    void studentApplicationIsolation() throws Exception {
        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].applicationId").value(appA.getApplicationId()));

        mockMvc.perform(get("/api/applications/" + appA.getApplicationId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/applications/" + appB.getApplicationId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student A retrieves only their own interviews in list and cannot access Student B's interview by ID")
    void studentInterviewIsolation() throws Exception {
        mockMvc.perform(get("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].interviewId").value(intA.getInterviewId()));

        mockMvc.perform(get("/api/interviews/" + intA.getInterviewId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/interviews/" + intB.getInterviewId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student A retrieves only their own placements in list and cannot access Student B's placement by ID")
    void studentPlacementIsolation() throws Exception {
        mockMvc.perform(get("/api/placements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].placementId").value(plcA.getPlacementId()));

        mockMvc.perform(get("/api/placements/" + plcA.getPlacementId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/placements/" + plcB.getPlacementId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Student A cannot apply for a job passing Student B's student ID")
    void studentCannotApplyForAnotherStudent() throws Exception {
        mockMvc.perform(post("/api/procedures/apply?studentId=102&jobId=1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Placement Officer can access both Student A and Student B records")
    void placementOfficerCanAccessAllStudentRecords() throws Exception {
        mockMvc.perform(get("/api/students/101")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice"));

        mockMvc.perform(get("/api/students/102")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bob"));

        mockMvc.perform(get("/api/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/interviews")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/placements")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }
}
