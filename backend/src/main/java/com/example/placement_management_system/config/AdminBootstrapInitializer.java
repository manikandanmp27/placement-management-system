package com.example.placement_management_system.config;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapInitializer.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminBootstrapInitializer(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin.email:}") String adminEmail,
            @Value("${app.bootstrap.admin.password:}") String adminPassword) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail != null ? adminEmail.trim() : "";
        this.adminPassword = adminPassword != null ? adminPassword : "";
    }

    @Override
    public void run(String... args) {
        if (appUserRepository.countByRole(Role.ROLE_ADMIN) > 0) {
            logger.info("Admin account already exists. Bootstrap skipped.");
            return;
        }

        if (adminEmail.isEmpty() || adminPassword.isEmpty()) {
            logger.warn("No admin account exists and ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD are not configured. Admin bootstrap skipped.");
            return;
        }

        String normalizedEmail = adminEmail.toLowerCase();
        AppUser adminUser = new AppUser(
                normalizedEmail,
                passwordEncoder.encode(adminPassword),
                Role.ROLE_ADMIN,
                null);
        adminUser.setEnabled(true);

        appUserRepository.save(adminUser);
        logger.info("Initial admin account created for email: {}", normalizedEmail);
    }
}
