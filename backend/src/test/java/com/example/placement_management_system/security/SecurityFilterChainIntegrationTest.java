package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.repository.AppUserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class SecurityFilterChainIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private AppUser activeUser;
    private AppUser disabledUser;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        appUserRepository.deleteAll();

        activeUser = new AppUser(
                "active@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                null);
        activeUser.setEnabled(true);
        activeUser = appUserRepository.save(activeUser);

        disabledUser = new AppUser(
                "disabled@university.edu",
                passwordEncoder.encode("Password123!"),
                Role.ROLE_STUDENT,
                null);
        disabledUser.setEnabled(false);
        disabledUser = appUserRepository.save(disabledUser);
    }

    @Test
    @DisplayName("1. POST /api/auth/login is publicly accessible without token")
    void loginIsPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"invalid@test.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. POST /api/auth/register-student is publicly accessible without token")
    void registerStudentIsPublic() throws Exception {
        mockMvc.perform(post("/api/auth/register-student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":9999,\"email\":\"invalid@test.com\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3. GET /api/health is publicly accessible without token")
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("4. GET /api/auth/me rejects unauthenticated requests with JSON 401")
    void authMeRejectsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("5. Protected business endpoints reject requests without token with JSON 401")
    void protectedEndpointsRejectWithoutToken() throws Exception {
        mockMvc.perform(get("/api/students"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("6. Protected endpoints reject malformed JWTs")
    void protectedEndpointsRejectMalformedJwt() throws Exception {
        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not.a.valid.jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("7. Protected endpoints reject expired JWTs")
    void protectedEndpointsRejectExpiredJwt() throws Exception {
        String expiredToken = jwtService.generateToken(new HashMap<>(), "active@university.edu", -10000L);

        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("8. Protected endpoints reject tokens signed with a different secret")
    void protectedEndpointsRejectForeignSignedJwt() throws Exception {
        SecretKey foreignKey = Keys.hmacShaKeyFor(
                "foreign-test-secret-key-at-least-256-bits-long-32-bytes".getBytes(StandardCharsets.UTF_8));
        String foreignToken = Jwts.builder()
                .subject("active@university.edu")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(foreignKey, Jwts.SIG.HS256)
                .compact();

        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + foreignToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("9. Valid JWT for active user authenticates successfully")
    void validJwtAuthenticatesSuccessfully() throws Exception {
        String token = jwtService.generateToken(
                activeUser.getEmail(), activeUser.getUserId(), activeUser.getRole(), null);

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("active@university.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"));
    }

    @Test
    @DisplayName("10. Disabled accounts are rejected even with previously issued valid JWTs")
    void disabledAccountsRejectedWithValidJwt() throws Exception {
        String token = jwtService.generateToken(
                disabledUser.getEmail(), disabledUser.getUserId(), disabledUser.getRole(), null);

        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("11. Unknown or deleted accounts are rejected even with previously issued valid JWTs")
    void unknownAccountsRejectedWithValidJwt() throws Exception {
        String token = jwtService.generateToken(
                "deleted@university.edu", 9999, Role.ROLE_STUDENT, null);

        mockMvc.perform(get("/api/students")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("12. Invalid authentication returns JSON 401 response format")
    void invalidAuthReturnsConsistentJson() throws Exception {
        mockMvc.perform(get("/api/companies"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Full authentication is required to access this resource"))
                .andExpect(jsonPath("$.path").value("/api/companies"));
    }

    @Test
    @DisplayName("13. CORS preflight requests succeed with appropriate headers")
    void corsPreflightRequestsSucceed() throws Exception {
        mockMvc.perform(options("/api/students")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS));
    }
}
