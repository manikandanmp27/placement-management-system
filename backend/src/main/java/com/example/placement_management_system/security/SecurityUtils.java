package com.example.placement_management_system.security;

import com.example.placement_management_system.entity.Role;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }
        return null;
    }

    public static Integer getCurrentStudentId() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getStudentId() : null;
    }

    public static Role getCurrentUserRole() {
        CustomUserDetails user = getCurrentUserDetails();
        return user != null ? user.getRole() : null;
    }

    public static boolean isStaff() {
        Role role = getCurrentUserRole();
        return role == Role.ROLE_ADMIN || role == Role.ROLE_PLACEMENT_OFFICER;
    }

    public static boolean isStudent() {
        return getCurrentUserRole() == Role.ROLE_STUDENT;
    }

    public static void validateStudentOwnership(Integer targetStudentId, String message) {
        if (isStaff()) {
            return;
        }
        Integer currentStudentId = getCurrentStudentId();
        if (currentStudentId == null || !currentStudentId.equals(targetStudentId)) {
            throw new AccessDeniedException(message != null ? message : "Access denied: Unauthorized access to student data");
        }
    }
}
