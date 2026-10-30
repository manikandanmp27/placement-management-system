package com.example.placement_management_system.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class JwtStartupFailureTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(JwtService.class);

    @Test
    @DisplayName("Application context fails to start when jwt.secret is missing or blank")
    void contextFailsWhenSecretMissing() {
        contextRunner
                .withPropertyValues("jwt.secret=", "jwt.expiration-ms=3600000")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalStateException.class)
                            .hasRootCauseMessage("JWT secret is not configured. The 'JWT_SECRET' environment variable must be set with a cryptographically secure key of at least 256 bits (32 bytes).");
                });
    }

    @Test
    @DisplayName("Application context fails to start when jwt.secret is shorter than 256 bits")
    void contextFailsWhenSecretWeak() {
        contextRunner
                .withPropertyValues("jwt.secret=too-short-secret-key", "jwt.expiration-ms=3600000")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasRootCauseInstanceOf(IllegalStateException.class);
                    // Verify the secret content is never leaked in the failure message
                    assertThat(context.getStartupFailure().getMessage())
                            .doesNotContain("too-short-secret-key");
                });
    }

    @Test
    @DisplayName("Application context starts successfully when a valid 256-bit secret is provided")
    void contextStartsWhenSecretValid() {
        contextRunner
                .withPropertyValues(
                        "jwt.secret=a-very-long-and-secure-test-secret-key-that-is-at-least-256-bits-long",
                        "jwt.expiration-ms=3600000")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(JwtService.class);
                });
    }
}
