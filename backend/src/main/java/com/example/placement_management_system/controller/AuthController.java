package com.example.placement_management_system.controller;

import com.example.placement_management_system.dto.AuthRequest;
import com.example.placement_management_system.dto.AuthResponse;
import com.example.placement_management_system.dto.DemoLoginRequest;
import com.example.placement_management_system.dto.RegisterStudentRequest;
import com.example.placement_management_system.dto.UserProfileResponse;
import com.example.placement_management_system.service.AuthService;
import com.example.placement_management_system.service.DemoAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final DemoAccountService demoAccountService;

    public AuthController(AuthService authService, DemoAccountService demoAccountService) {
        this.authService = authService;
        this.demoAccountService = demoAccountService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/demo-login")
    public ResponseEntity<AuthResponse> demoLogin(@Valid @RequestBody DemoLoginRequest request) {
        return ResponseEntity.ok(demoAccountService.demoLogin(request.getRole()));
    }

    @PostMapping("/register-student")
    public ResponseEntity<AuthResponse> registerStudent(@Valid @RequestBody RegisterStudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerStudent(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getUserProfileByEmail(authentication.getName()));
    }
}
