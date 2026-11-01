package com.example.placement_management_system.security;

import com.example.placement_management_system.dto.DemoLoginRequest;
import com.example.placement_management_system.service.DemoAccountService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.demo.enabled=true"})
@ActiveProfiles("test")
class DemoLoginIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private DemoAccountService demoAccountService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        demoAccountService.initDemoAccountsAndData();
    }

    @Test
    @DisplayName("POST /api/auth/demo-login with STUDENT role returns 200, valid JWT, and isDemo=true")
    void testDemoStudentLogin() throws Exception {
        DemoLoginRequest request = new DemoLoginRequest("STUDENT");

        MvcResult result = mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.email").value("demo.student@campushire.edu"))
                .andExpect(jsonPath("$.studentId").value(999))
                .andExpect(jsonPath("$.isDemo").value(true))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = jsonNode.get("token").asText();

        // Verify /api/auth/me returns demo profile
        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("demo.student@campushire.edu"))
                .andExpect(jsonPath("$.role").value("ROLE_STUDENT"))
                .andExpect(jsonPath("$.isDemo").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/demo-login with OFFICER role returns 200, valid JWT, and isDemo=true")
    void testDemoOfficerLogin() throws Exception {
        DemoLoginRequest request = new DemoLoginRequest("OFFICER");

        mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ROLE_PLACEMENT_OFFICER"))
                .andExpect(jsonPath("$.email").value("demo.officer@campushire.edu"))
                .andExpect(jsonPath("$.studentId").doesNotExist())
                .andExpect(jsonPath("$.isDemo").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/demo-login with ADMIN role is strictly forbidden")
    void testDemoAdminLoginForbidden() throws Exception {
        DemoLoginRequest request = new DemoLoginRequest("ADMIN");

        mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Demo admin accounts are strictly prohibited")));
    }

    @Test
    @DisplayName("Demo officer cannot perform destructive deletion on companies")
    void testDemoOfficerDestructiveActionRestricted() throws Exception {
        // Login as demo officer
        DemoLoginRequest loginReq = new DemoLoginRequest("OFFICER");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Try to delete company
        mockMvc.perform(delete("/api/companies/1")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("disabled in Demo Mode to protect shared sample data")));
    }

    @Test
    @DisplayName("Demo student cannot access officer-only company endpoints or delete records")
    void testDemoStudentRestrictedFromOfficerEndpoints() throws Exception {
        DemoLoginRequest loginReq = new DemoLoginRequest("STUDENT");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/demo-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Try to delete application
        mockMvc.perform(delete("/api/applications/391")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
