package com.example.placement_management_system.controller;

import com.example.placement_management_system.dto.AuthRequest;
import com.example.placement_management_system.dto.AuthResponse;
import com.example.placement_management_system.dto.DemoLoginRequest;
import com.example.placement_management_system.dto.RegisterStudentRequest;
import com.example.placement_management_system.dto.UserProfileResponse;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.exception.GlobalExceptionHandler;
import com.example.placement_management_system.service.AuthService;
import com.example.placement_management_system.service.DemoAccountService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private DemoAccountService demoAccountService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        AuthController authController = new AuthController(authService, demoAccountService);
        this.mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register-student succeeds with valid body and does not return password hash")
    void registerStudentSuccess() throws Exception {
        AuthResponse response = new AuthResponse("mock-jwt-token", "Bearer", 1, "student@university.edu", Role.ROLE_STUDENT, 101);
        when(authService.registerStudent(any(RegisterStudentRequest.class))).thenReturn(response);

        RegisterStudentRequest request = new RegisterStudentRequest(101, "student@university.edu", "Password123!");

        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.email").value("student@university.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/register-student returns 400 when validation fails")
    void registerStudentValidationFailure() throws Exception {
        RegisterStudentRequest shortPassword = new RegisterStudentRequest(101, "invalid-email", "short");

        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPassword)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register-student returns 400 when email or student mismatch occurs")
    void registerStudentMismatchReturnsBadRequest() throws Exception {
        when(authService.registerStudent(any(RegisterStudentRequest.class)))
                .thenThrow(new IllegalArgumentException("Email does not match registered student email"));

        RegisterStudentRequest request = new RegisterStudentRequest(101, "wrong@university.edu", "Password123!");

        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email does not match registered student email"));
    }

    @Test
    @DisplayName("POST /api/auth/register-student returns 409 when account already exists")
    void registerStudentDuplicateReturnsConflict() throws Exception {
        when(authService.registerStudent(any(RegisterStudentRequest.class)))
                .thenThrow(new IllegalStateException("An account with this email already exists"));

        RegisterStudentRequest request = new RegisterStudentRequest(101, "student@university.edu", "Password123!");

        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(content().string("An account with this email already exists"));
    }

    @Test
    @DisplayName("POST /api/auth/login succeeds with valid credentials and does not return password hash")
    void loginSuccess() throws Exception {
        AuthResponse response = new AuthResponse("mock-jwt-token", "Bearer", 1, "student@university.edu", Role.ROLE_STUDENT, 101);
        when(authService.login(any(AuthRequest.class))).thenReturn(response);

        AuthRequest request = new AuthRequest("student@university.edu", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.email").value("student@university.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 on bad credentials")
    void loginBadCredentials() throws Exception {
        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        AuthRequest request = new AuthRequest("student@university.edu", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 403 when account is disabled")
    void loginDisabledAccount() throws Exception {
        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new DisabledException("Account is disabled"));

        AuthRequest request = new AuthRequest("disabled@university.edu", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().string("Account is disabled"));
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 when unauthenticated")
    void getMeUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me returns safe profile when authenticated")
    void getMeAuthenticated() throws Exception {
        UserProfileResponse profile = new UserProfileResponse(
                1, "user@university.edu", Role.ROLE_STUDENT, 101, true, LocalDateTime.now());
        when(authService.getUserProfileByEmail("user@university.edu")).thenReturn(profile);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("user@university.edu", null, null);

        mockMvc.perform(get("/api/auth/me").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.email").value("user@university.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/demo-login returns token and isDemo=true for valid demo role")
    void demoLoginSuccess() throws Exception {
        AuthResponse response = new AuthResponse("mock-demo-token", "Bearer", 99, "demo.student@campushire.edu", Role.ROLE_STUDENT, 999, true);
        when(demoAccountService.demoLogin("STUDENT")).thenReturn(response);

        DemoLoginRequest request = new DemoLoginRequest("STUDENT");

        mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-demo-token"))
                .andExpect(jsonPath("$.email").value("demo.student@campushire.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.studentId").value(999))
                .andExpect(jsonPath("$.isDemo").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/demo-login returns 400 when role is blank")
    void demoLoginBlankRole() throws Exception {
        DemoLoginRequest request = new DemoLoginRequest("");

        mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
