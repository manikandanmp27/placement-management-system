package com.example.placement_management_system.service;

import com.example.placement_management_system.dto.AuthRequest;
import com.example.placement_management_system.dto.AuthResponse;
import com.example.placement_management_system.entity.*;
import com.example.placement_management_system.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class DemoAccountService {

    private static final Logger logger = LoggerFactory.getLogger(DemoAccountService.class);

    public static final Integer DEMO_STUDENT_ID = 999;
    public static final Integer DEMO_APP_1_ID = 391;
    public static final Integer DEMO_APP_2_ID = 392;
    public static final Integer DEMO_APP_3_ID = 393;
    public static final Integer DEMO_INT_1_ID = 491;
    public static final Integer DEMO_INT_2_ID = 492;
    public static final Integer DEMO_INT_3_ID = 493;

    private final AppUserRepository appUserRepository;
    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    private final boolean demoEnabled;
    private final String demoStudentEmail;
    private final String demoStudentPassword;
    private final String demoOfficerEmail;
    private final String demoOfficerPassword;

    public DemoAccountService(
            AppUserRepository appUserRepository,
            StudentRepository studentRepository,
            DepartmentRepository departmentRepository,
            JobRepository jobRepository,
            ApplicationRepository applicationRepository,
            InterviewRepository interviewRepository,
            PasswordEncoder passwordEncoder,
            AuthService authService,
            @Value("${app.demo.enabled:true}") boolean demoEnabled,
            @Value("${app.demo.student.email:demo.student@campushire.edu}") String demoStudentEmail,
            @Value("${app.demo.student.password:DemoStudent@2026}") String demoStudentPassword,
            @Value("${app.demo.officer.email:demo.officer@campushire.edu}") String demoOfficerEmail,
            @Value("${app.demo.officer.password:DemoOfficer@2026}") String demoOfficerPassword) {
        this.appUserRepository = appUserRepository;
        this.studentRepository = studentRepository;
        this.departmentRepository = departmentRepository;
        this.jobRepository = jobRepository;
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.demoEnabled = demoEnabled;
        this.demoStudentEmail = demoStudentEmail != null ? demoStudentEmail.trim().toLowerCase() : "demo.student@campushire.edu";
        this.demoStudentPassword = demoStudentPassword != null ? demoStudentPassword : "DemoStudent@2026";
        this.demoOfficerEmail = demoOfficerEmail != null ? demoOfficerEmail.trim().toLowerCase() : "demo.officer@campushire.edu";
        this.demoOfficerPassword = demoOfficerPassword != null ? demoOfficerPassword : "DemoOfficer@2026";
    }

    public boolean isDemoEnabled() {
        return demoEnabled;
    }

    public String getDemoStudentEmail() {
        return demoStudentEmail;
    }

    public String getDemoOfficerEmail() {
        return demoOfficerEmail;
    }

    public boolean isDemoEmail(String email) {
        if (email == null) return false;
        String normalized = email.trim().toLowerCase();
        return normalized.equals(demoStudentEmail) || normalized.equals(demoOfficerEmail) || normalized.startsWith("demo.");
    }

    public AuthResponse demoLogin(String rawRole) {
        if (!demoEnabled) {
            throw new IllegalStateException("Demo accounts are currently disabled in this environment.");
        }

        if (rawRole == null || rawRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required for demo login.");
        }

        String normalizedRole = rawRole.trim().toUpperCase();

        if (normalizedRole.contains("ADMIN")) {
            throw new AccessDeniedException("Demo admin accounts are strictly prohibited.");
        }

        String targetEmail;
        String targetPassword;

        if (normalizedRole.equals("STUDENT") || normalizedRole.equals("ROLE_STUDENT")) {
            targetEmail = demoStudentEmail;
            targetPassword = demoStudentPassword;
        } else if (normalizedRole.equals("OFFICER") || normalizedRole.equals("ROLE_PLACEMENT_OFFICER") || normalizedRole.equals("PLACEMENT_OFFICER")) {
            targetEmail = demoOfficerEmail;
            targetPassword = demoOfficerPassword;
        } else {
            throw new IllegalArgumentException("Unsupported demo role. Allowed roles: STUDENT, OFFICER.");
        }

        // Authenticate through standard AuthService login
        AuthResponse response = authService.login(new AuthRequest(targetEmail, targetPassword));
        response.setIsDemo(true);
        return response;
    }

    @Transactional
    public void initDemoAccountsAndData() {
        if (!demoEnabled) {
            logger.info("Demo accounts initialization disabled by configuration.");
            return;
        }

        try {
            initDemoOfficer();
            initDemoStudent();
            logger.info("Demo accounts and sample data verified/provisioned successfully.");
        } catch (Exception e) {
            logger.error("Failed to initialize demo accounts: {}", e.getMessage(), e);
        }
    }

    private void initDemoOfficer() {
        Optional<AppUser> officerOpt = appUserRepository.findByEmail(demoOfficerEmail);
        if (officerOpt.isEmpty()) {
            AppUser officer = new AppUser(
                    demoOfficerEmail,
                    passwordEncoder.encode(demoOfficerPassword),
                    Role.ROLE_PLACEMENT_OFFICER,
                    null);
            officer.setEnabled(true);
            appUserRepository.save(officer);
            logger.info("Provisioned Demo Officer account: {}", demoOfficerEmail);
        } else {
            AppUser officer = officerOpt.get();
            officer.setPasswordHash(passwordEncoder.encode(demoOfficerPassword));
            officer.setRole(Role.ROLE_PLACEMENT_OFFICER);
            officer.setEnabled(true);
            appUserRepository.save(officer);
        }
    }

    private void initDemoStudent() {
        Department dept = departmentRepository.findById(1).orElseGet(() -> {
            Department newDept = new Department();
            newDept.setDepartmentId(1);
            newDept.setDepartmentName("Computer Science and Engineering");
            return departmentRepository.save(newDept);
        });

        Student student = studentRepository.findById(DEMO_STUDENT_ID).orElseGet(() -> {
            Student s = new Student();
            s.setStudentId(DEMO_STUDENT_ID);
            return s;
        });

        student.setName("Rohan Verma (Demo Student)");
        student.setEmail(demoStudentEmail);
        student.setPhone("9876543210");
        student.setDepartment(dept);
        student.setGraduationYear(2027);
        student.setCgpa(8.85);
        student.setBacklogs(0);
        student.setPlacementStatus("NOT_PLACED");
        student.setIsArchived(false);
        student = studentRepository.save(student);

        Optional<AppUser> studentUserOpt = appUserRepository.findByEmail(demoStudentEmail);
        if (studentUserOpt.isEmpty()) {
            AppUser studentUser = new AppUser(
                    demoStudentEmail,
                    passwordEncoder.encode(demoStudentPassword),
                    Role.ROLE_STUDENT,
                    student);
            studentUser.setEnabled(true);
            appUserRepository.save(studentUser);
            logger.info("Provisioned Demo Student account: {}", demoStudentEmail);
        } else {
            AppUser studentUser = studentUserOpt.get();
            studentUser.setPasswordHash(passwordEncoder.encode(demoStudentPassword));
            studentUser.setRole(Role.ROLE_STUDENT);
            studentUser.setStudent(student);
            studentUser.setEnabled(true);
            appUserRepository.save(studentUser);
        }

        seedDemoStudentApplicationsAndInterviews(student);
    }

    private void seedDemoStudentApplicationsAndInterviews(Student student) {
        Optional<Job> job201 = jobRepository.findById(201);
        Optional<Job> job203 = jobRepository.findById(203);
        Optional<Job> job206 = jobRepository.findById(206);

        if (job201.isPresent()) {
            Application app1 = applicationRepository.findById(DEMO_APP_1_ID).orElseGet(() -> {
                Application a = new Application();
                a.setApplicationId(DEMO_APP_1_ID);
                return a;
            });
            app1.setStudent(student);
            app1.setJob(job201.get());
            app1.setApplicationDate(LocalDate.now().minusDays(15));
            app1.setStatus("SHORTLISTED");
            app1 = applicationRepository.save(app1);

            Interview int1 = interviewRepository.findById(DEMO_INT_1_ID).orElseGet(() -> {
                Interview i = new Interview();
                i.setInterviewId(DEMO_INT_1_ID);
                return i;
            });
            int1.setApplication(app1);
            int1.setRoundNumber(1);
            int1.setRoundType("Technical");
            int1.setInterviewDate(LocalDate.now().minusDays(5));
            int1.setResult("Passed");
            interviewRepository.save(int1);

            Interview int2 = interviewRepository.findById(DEMO_INT_2_ID).orElseGet(() -> {
                Interview i = new Interview();
                i.setInterviewId(DEMO_INT_2_ID);
                return i;
            });
            int2.setApplication(app1);
            int2.setRoundNumber(2);
            int2.setRoundType("HR");
            int2.setInterviewDate(LocalDate.now().plusDays(5));
            int2.setResult("Pending");
            interviewRepository.save(int2);
        }

        if (job203.isPresent()) {
            Application app2 = applicationRepository.findById(DEMO_APP_2_ID).orElseGet(() -> {
                Application a = new Application();
                a.setApplicationId(DEMO_APP_2_ID);
                return a;
            });
            app2.setStudent(student);
            app2.setJob(job203.get());
            app2.setApplicationDate(LocalDate.now().minusDays(8));
            app2.setStatus("APPLIED");
            applicationRepository.save(app2);
        }

        if (job206.isPresent()) {
            Application app3 = applicationRepository.findById(DEMO_APP_3_ID).orElseGet(() -> {
                Application a = new Application();
                a.setApplicationId(DEMO_APP_3_ID);
                return a;
            });
            app3.setStudent(student);
            app3.setJob(job206.get());
            app3.setApplicationDate(LocalDate.now().minusDays(12));
            app3.setStatus("SHORTLISTED");
            app3 = applicationRepository.save(app3);

            Interview int3 = interviewRepository.findById(DEMO_INT_3_ID).orElseGet(() -> {
                Interview i = new Interview();
                i.setInterviewId(DEMO_INT_3_ID);
                return i;
            });
            int3.setApplication(app3);
            int3.setRoundNumber(1);
            int3.setRoundType("Technical");
            int3.setInterviewDate(LocalDate.now().plusDays(10));
            int3.setResult("Pending");
            interviewRepository.save(int3);
        }
    }
}
