package com.example.placement_management_system.config;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.repository.AppUserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapInitializerTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Admin bootstrap creates admin with BCrypt hash when none exists and env vars provided")
    void bootstrapCreatesAdminWhenNoneExists() {
        when(appUserRepository.countByRole(Role.ROLE_ADMIN)).thenReturn(0L);
        when(passwordEncoder.encode("AdminPass123!")).thenReturn("$2a$10$encodedPassword");

        AdminBootstrapInitializer initializer = new AdminBootstrapInitializer(
                appUserRepository,
                passwordEncoder,
                "admin@university.edu",
                "AdminPass123!");

        initializer.run();

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(captor.capture());

        AppUser createdAdmin = captor.getValue();
        assertThat(createdAdmin.getEmail()).isEqualTo("admin@university.edu");
        assertThat(createdAdmin.getPasswordHash()).isEqualTo("$2a$10$encodedPassword");
        assertThat(createdAdmin.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(createdAdmin.getStudent()).isNull();
        assertThat(createdAdmin.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("Admin bootstrap is idempotent and does not overwrite existing admin")
    void bootstrapSkippedWhenAdminAlreadyExists() {
        when(appUserRepository.countByRole(Role.ROLE_ADMIN)).thenReturn(1L);

        AdminBootstrapInitializer initializer = new AdminBootstrapInitializer(
                appUserRepository,
                passwordEncoder,
                "admin@university.edu",
                "AdminPass123!");

        initializer.run();

        verify(appUserRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("Admin bootstrap follows safe policy and skips creation when credentials are blank")
    void bootstrapSkippedWhenCredentialsBlank() {
        when(appUserRepository.countByRole(Role.ROLE_ADMIN)).thenReturn(0L);

        AdminBootstrapInitializer initializer = new AdminBootstrapInitializer(
                appUserRepository,
                passwordEncoder,
                "",
                "");

        initializer.run();

        verify(appUserRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("Admin bootstrap follows safe policy and skips creation when credentials are null")
    void bootstrapSkippedWhenCredentialsNull() {
        when(appUserRepository.countByRole(Role.ROLE_ADMIN)).thenReturn(0L);

        AdminBootstrapInitializer initializer = new AdminBootstrapInitializer(
                appUserRepository,
                passwordEncoder,
                null,
                null);

        initializer.run();

        verify(appUserRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }
}
