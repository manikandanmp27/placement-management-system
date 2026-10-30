package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.entity.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import static org.assertj.core.api.Assertions.assertThat;

class CustomUserDetailsTest {

    @Test
    @DisplayName("CustomUserDetails maps properties, authorities, and enabled status correctly for students")
    void studentUserDetailsMapping() {
        Student student = new Student();
        student.setStudentId(101);

        AppUser user = new AppUser("student@university.edu", "$2a$10$hash", Role.ROLE_STUDENT, student);
        user.setEnabled(true);

        CustomUserDetails userDetails = new CustomUserDetails(user);

        assertThat(userDetails.getUsername()).isEqualTo("student@university.edu");
        assertThat(userDetails.getPassword()).isEqualTo("$2a$10$hash");
        assertThat(userDetails.getRole()).isEqualTo(Role.ROLE_STUDENT);
        assertThat(userDetails.getStudentId()).isEqualTo(101);
        assertThat(userDetails.isEnabled()).isTrue();
        assertThat(userDetails.isAccountNonExpired()).isTrue();
        assertThat(userDetails.isAccountNonLocked()).isTrue();
        assertThat(userDetails.isCredentialsNonExpired()).isTrue();
        assertThat(userDetails.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_STUDENT");
    }

    @Test
    @DisplayName("CustomUserDetails maps properties correctly for admin without student linkage")
    void adminUserDetailsMapping() {
        AppUser admin = new AppUser("admin@university.edu", "$2a$10$adminHash", Role.ROLE_ADMIN, null);
        admin.setEnabled(false);

        CustomUserDetails userDetails = new CustomUserDetails(admin);

        assertThat(userDetails.getUsername()).isEqualTo("admin@university.edu");
        assertThat(userDetails.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(userDetails.getStudentId()).isNull();
        assertThat(userDetails.isEnabled()).isFalse();
        assertThat(userDetails.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN");
    }
}
