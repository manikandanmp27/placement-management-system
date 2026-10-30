package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    private CustomUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userDetailsService = new CustomUserDetailsService(appUserRepository);
    }

    @Test
    @DisplayName("loadUserByUsername finds user by normalized email and returns CustomUserDetails")
    void loadUserByUsernameSuccess() {
        AppUser user = new AppUser("user@university.edu", "$2a$10$hash", Role.ROLE_STUDENT, null);
        when(appUserRepository.findByEmail("user@university.edu")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername(" USER@UNIVERSITY.EDU ");

        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("user@university.edu");
    }

    @Test
    @DisplayName("loadUserByUsername throws UsernameNotFoundException when account does not exist")
    void loadUserByUsernameNotFound() {
        when(appUserRepository.findByEmail("unknown@university.edu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("unknown@university.edu"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found with email: unknown@university.edu");
    }

    @Test
    @DisplayName("loadUserByUsername throws UsernameNotFoundException when email is blank")
    void loadUserByUsernameBlank() {
        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("   "))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Email cannot be empty");
    }
}
