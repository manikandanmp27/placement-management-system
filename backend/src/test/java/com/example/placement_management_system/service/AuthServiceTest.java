package com.example.placement_management_system.service;

import com.example.placement_management_system.dto.AuthRequest;
import com.example.placement_management_system.dto.AuthResponse;
import com.example.placement_management_system.dto.RegisterStudentRequest;
import com.example.placement_management_system.dto.UserProfileResponse;
import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import com.example.placement_management_system.entity.Student;
import com.example.placement_management_system.repository.AppUserRepository;
import com.example.placement_management_system.repository.StudentRepository;
import com.example.placement_management_system.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(appUserRepository, studentRepository, passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("Successful student registration hashes password, assigns ROLE_STUDENT, and returns token")
    void registerStudentSuccess() {
        Student student = new Student();
        student.setStudentId(101);
        student.setEmail("student@university.edu");

        when(studentRepository.findById(101)).thenReturn(Optional.of(student));
        when(appUserRepository.existsByEmail("student@university.edu")).thenReturn(false);
        when(appUserRepository.existsByStudent_StudentId(101)).thenReturn(false);
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("$2a$10$hashedPassword");
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(anyString(), any(), any(), any())).thenReturn("mock-jwt-token");

        RegisterStudentRequest request = new RegisterStudentRequest(101, "student@university.edu", "SecurePass123!");
        AuthResponse response = authService.registerStudent(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getRole()).isEqualTo(Role.ROLE_STUDENT);
        assertThat(response.getEmail()).isEqualTo("student@university.edu");
        assertThat(response.getStudentId()).isEqualTo(101);

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());
        AppUser savedUser = userCaptor.getValue();

        assertThat(savedUser.getRole()).isEqualTo(Role.ROLE_STUDENT);
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$10$hashedPassword");
        assertThat(savedUser.getStudent()).isEqualTo(student);
        assertThat(savedUser.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("Student registration rejected if student record does not exist")
    void registerStudentFailsWhenStudentNotFound() {
        when(studentRepository.findById(999)).thenReturn(Optional.empty());

        RegisterStudentRequest request = new RegisterStudentRequest(999, "student@university.edu", "SecurePass123!");

        assertThatThrownBy(() -> authService.registerStudent(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Student record not found");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    @DisplayName("Student registration rejected if email does not match registered student email")
    void registerStudentFailsWhenEmailMismatched() {
        Student student = new Student();
        student.setStudentId(101);
        student.setEmail("correct@university.edu");

        when(studentRepository.findById(101)).thenReturn(Optional.of(student));

        RegisterStudentRequest request = new RegisterStudentRequest(101, "wrong@university.edu", "SecurePass123!");

        assertThatThrownBy(() -> authService.registerStudent(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email does not match");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    @DisplayName("Student registration rejected if email is already registered")
    void registerStudentFailsWhenEmailAlreadyExists() {
        Student student = new Student();
        student.setStudentId(101);
        student.setEmail("student@university.edu");

        when(studentRepository.findById(101)).thenReturn(Optional.of(student));
        when(appUserRepository.existsByEmail("student@university.edu")).thenReturn(true);

        RegisterStudentRequest request = new RegisterStudentRequest(101, "student@university.edu", "SecurePass123!");

        assertThatThrownBy(() -> authService.registerStudent(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("An account with this email already exists");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    @DisplayName("Student registration rejected if student ID is already linked to an account")
    void registerStudentFailsWhenStudentAlreadyLinked() {
        Student student = new Student();
        student.setStudentId(101);
        student.setEmail("student@university.edu");

        when(studentRepository.findById(101)).thenReturn(Optional.of(student));
        when(appUserRepository.existsByEmail("student@university.edu")).thenReturn(false);
        when(appUserRepository.existsByStudent_StudentId(101)).thenReturn(true);

        RegisterStudentRequest request = new RegisterStudentRequest(101, "student@university.edu", "SecurePass123!");

        assertThatThrownBy(() -> authService.registerStudent(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("An account for this student already exists");

        verify(appUserRepository, never()).save(any());
    }

    @Test
    @DisplayName("Successful login returns token and safe profile details")
    void loginSuccess() {
        AppUser user = new AppUser("user@university.edu", "$2a$10$hashedPassword", Role.ROLE_STUDENT, null);
        user.setEnabled(true);

        when(appUserRepository.findByEmail("user@university.edu")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPassword", "$2a$10$hashedPassword")).thenReturn(true);
        when(jwtService.generateToken(anyString(), any(), any(), any())).thenReturn("generated-jwt-token");

        AuthRequest request = new AuthRequest("user@university.edu", "rawPassword");
        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("generated-jwt-token");
        assertThat(response.getEmail()).isEqualTo("user@university.edu");
        assertThat(response.getRole()).isEqualTo(Role.ROLE_STUDENT);
    }

    @Test
    @DisplayName("Login rejected when password does not match")
    void loginFailsWithBadPassword() {
        AppUser user = new AppUser("user@university.edu", "$2a$10$hashedPassword", Role.ROLE_ADMIN, null);
        user.setEnabled(true);

        when(appUserRepository.findByEmail("user@university.edu")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "$2a$10$hashedPassword")).thenReturn(false);

        AuthRequest request = new AuthRequest("user@university.edu", "wrongPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Login rejected when user does not exist")
    void loginFailsWhenUserNotFound() {
        when(appUserRepository.findByEmail("nonexistent@university.edu")).thenReturn(Optional.empty());

        AuthRequest request = new AuthRequest("nonexistent@university.edu", "anyPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Login rejected when account is disabled")
    void loginFailsWhenAccountDisabled() {
        AppUser user = new AppUser("user@university.edu", "$2a$10$hashedPassword", Role.ROLE_STUDENT, null);
        user.setEnabled(false);

        when(appUserRepository.findByEmail("user@university.edu")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("rawPassword", "$2a$10$hashedPassword")).thenReturn(true);

        AuthRequest request = new AuthRequest("user@university.edu", "rawPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(DisabledException.class)
                .hasMessage("Account is disabled");
    }

    @Test
    @DisplayName("Profile retrieval returns safe user details without password hash")
    void getUserProfileSafe() {
        AppUser user = new AppUser("admin@university.edu", "$2a$10$secretHash", Role.ROLE_ADMIN, null);
        user.setEnabled(true);

        when(appUserRepository.findByEmail("admin@university.edu")).thenReturn(Optional.of(user));

        UserProfileResponse profile = authService.getUserProfileByEmail("admin@university.edu");

        assertThat(profile).isNotNull();
        assertThat(profile.getEmail()).isEqualTo("admin@university.edu");
        assertThat(profile.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(profile.getStudentId()).isNull();
        assertThat(profile.isEnabled()).isTrue();
    }
}
