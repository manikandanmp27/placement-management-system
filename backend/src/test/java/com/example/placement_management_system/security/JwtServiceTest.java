package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String TEST_SECRET = "test-secret-key-at-least-256-bits-long-32-bytes-minimum-for-testing-only";
    private static final String DIFFERENT_SECRET = "different-secret-key-also-at-least-256-bits-long-for-testing-only";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("1. Successful token generation")
    void testTokenGeneration() {
        String token = jwtService.generateToken("student@example.com", 1, Role.ROLE_STUDENT, 101);
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertEquals(3, token.split("\\.").length, "JWT must consist of header, payload, and signature components");
    }

    @Test
    @DisplayName("2. Successful extraction of email, user ID and role")
    void testExtractionOfClaims() {
        String token = jwtService.generateToken("officer@example.com", 42, Role.ROLE_PLACEMENT_OFFICER, null);

        assertEquals("officer@example.com", jwtService.extractEmail(token));
        assertEquals(42, jwtService.extractUserId(token));
        assertEquals(Role.ROLE_PLACEMENT_OFFICER, jwtService.extractRole(token));
        assertNull(jwtService.extractStudentId(token));

        String studentToken = jwtService.generateToken("aarav@example.com", 10, Role.ROLE_STUDENT, 105);
        assertEquals(105, jwtService.extractStudentId(studentToken));
        assertEquals(Role.ROLE_STUDENT, jwtService.extractRole(studentToken));
    }

    @Test
    @DisplayName("3. Successful validation of a valid token")
    void testValidationOfValidToken() {
        String token = jwtService.generateToken("admin@example.com", 99, Role.ROLE_ADMIN, null);
        assertTrue(jwtService.validateToken(token));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    @DisplayName("4. Rejection of an expired token")
    void testRejectionOfExpiredToken() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", 1);
        claims.put("role", Role.ROLE_STUDENT.name());

        // Token expired 5 seconds ago
        String expiredToken = jwtService.generateToken(claims, "expired@example.com", -5000);

        assertFalse(jwtService.validateToken(expiredToken));
        assertTrue(jwtService.isTokenExpired(expiredToken));
    }

    @Test
    @DisplayName("5. Rejection of a malformed token")
    void testRejectionOfMalformedToken() {
        assertFalse(jwtService.validateToken("malformed.jwt.token"));
        assertFalse(jwtService.validateToken(""));
        assertFalse(jwtService.validateToken("not-a-jwt"));
    }

    @Test
    @DisplayName("6. Rejection of a token signed with a different secret")
    void testRejectionOfTokenSignedWithDifferentSecret() {
        JwtService foreignJwtService = new JwtService(DIFFERENT_SECRET, EXPIRATION_MS);
        String tokenFromForeignService = foreignJwtService.generateToken("hacker@example.com", 666, Role.ROLE_ADMIN, null);

        assertTrue(foreignJwtService.validateToken(tokenFromForeignService));
        assertFalse(jwtService.validateToken(tokenFromForeignService), "Token signed with different secret must be rejected");
    }

    @Test
    @DisplayName("7. Rejection of secret shorter than 256 bits (32 bytes)")
    void testRejectionOfWeakSecret() {
        JwtService weakJwtService = new JwtService("short-secret-key", EXPIRATION_MS);
        assertThrows(IllegalArgumentException.class, weakJwtService::getSigningKey);
    }
}
