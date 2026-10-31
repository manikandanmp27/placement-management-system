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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository appUserRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.appUserRepository = appUserRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        AppUser user = appUserRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }

        Integer studentId = user.getStudent() != null ? user.getStudent().getStudentId() : null;
        String token = jwtService.generateToken(user.getEmail(), user.getUserId(), user.getRole(), studentId);

        return new AuthResponse(token, "Bearer", user.getUserId(), user.getEmail(), user.getRole(), studentId);
    }

    @Transactional
    public AuthResponse registerStudent(RegisterStudentRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student record not found"));

        if (Boolean.TRUE.equals(student.getIsArchived())) {
            throw new IllegalStateException("Archived student records are not eligible to register an account");
        }

        if (!student.getEmail().trim().equalsIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Email does not match registered student email");
        }

        if (appUserRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalStateException("An account with this email already exists");
        }

        if (appUserRepository.existsByStudent_StudentId(request.getStudentId())) {
            throw new IllegalStateException("An account for this student already exists");
        }

        AppUser user = new AppUser(
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_STUDENT,
                student);
        user.setEnabled(true);

        try {
            user = appUserRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("An account for this email or student already exists");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getUserId(), user.getRole(), student.getStudentId());

        return new AuthResponse(token, "Bearer", user.getUserId(), user.getEmail(), user.getRole(), student.getStudentId());
    }

    public UserProfileResponse getUserProfileByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        AppUser user = appUserRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Integer studentId = user.getStudent() != null ? user.getStudent().getStudentId() : null;
        return new UserProfileResponse(
                user.getUserId(),
                user.getEmail(),
                user.getRole(),
                studentId,
                user.isEnabled(),
                user.getCreatedAt());
    }
}
