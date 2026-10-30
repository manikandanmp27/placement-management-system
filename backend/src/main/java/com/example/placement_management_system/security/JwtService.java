package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service for issuing, parsing, and cryptographically validating HMAC-SHA256 (HS256) JWT tokens.
 * Complies with strict security standards: never logs secrets or full tokens.
 */
@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private static final int MIN_KEY_BYTES = 32; // Minimum 256 bits required for HS256

    private final String jwtSecret;
    private final long jwtExpirationMs;

    public JwtService(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        this.jwtSecret = jwtSecret;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    /**
     * Resolves the cryptographic signing key from the configured secret.
     * Supports both Base64-encoded keys and UTF-8 strings, enforcing a minimum of 256 bits.
     */
    public SecretKey getSigningKey() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret cannot be null or empty.");
        }
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        } catch (Exception e) {
            keyBytes = jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < MIN_KEY_BYTES) {
            byte[] rawBytes = jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
            if (rawBytes.length >= MIN_KEY_BYTES) {
                keyBytes = rawBytes;
            } else {
                throw new IllegalArgumentException(
                        "JWT secret key must be at least 256 bits (32 bytes) long. Provided size: " + keyBytes.length + " bytes.");
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT access token embedding userId, role, and optional studentId.
     */
    public String generateToken(String email, Integer userId, Role role, Integer studentId) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", userId);
        extraClaims.put("role", role != null ? role.name() : null);
        if (studentId != null) {
            extraClaims.put("studentId", studentId);
        }
        return generateToken(extraClaims, email, jwtExpirationMs);
    }

    /**
     * Overloaded generator allowing explicit custom expiration (useful for testing expiration).
     */
    public String generateToken(Map<String, Object> extraClaims, String subject, long customExpirationMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + customExpirationMs);

        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extracts all claims from a validated token payload.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Integer extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Integer.class));
    }

    public Role extractRole(String token) {
        String roleStr = extractClaim(token, claims -> claims.get("role", String.class));
        if (roleStr == null) {
            return null;
        }
        try {
            return Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            logger.warn("Unrecognized role value found in JWT payload: {}", roleStr);
            return null;
        }
    }

    public Integer extractStudentId(String token) {
        return extractClaim(token, claims -> claims.get("studentId", Integer.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Validates the cryptographic signature, format, and expiration of a JWT token.
     * Returns true if valid, false otherwise. Does not throw exceptions to caller.
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();
            if (expiration == null || expiration.before(new Date())) {
                logger.debug("JWT token is expired");
                return false;
            }
            return true;
        } catch (ExpiredJwtException e) {
            logger.debug("JWT validation failed: Token is expired");
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            logger.debug("JWT validation failed: {}", e.getClass().getSimpleName());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
