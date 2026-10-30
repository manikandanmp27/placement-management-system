package com.example.placement_management_system.repository;

import com.example.placement_management_system.entity.AppUser;
import com.example.placement_management_system.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Integer> {

    /**
     * Find an active or inactive user account by unique email.
     */
    Optional<AppUser> findByEmail(String email);

    /**
     * Check whether an account with the given email already exists.
     */
    boolean existsByEmail(String email);

    /**
     * Find user account associated with a specific student ID via traversal.
     */
    Optional<AppUser> findByStudent_StudentId(Integer studentId);

    /**
     * Find user account associated with a specific student ID via explicit query.
     */
    @Query("SELECT u FROM AppUser u WHERE u.student.studentId = :studentId")
    Optional<AppUser> findByStudentId(@Param("studentId") Integer studentId);

    /**
     * Check whether an account is already linked to the given student ID via traversal.
     */
    boolean existsByStudent_StudentId(Integer studentId);

    /**
     * Check whether an account is already linked to the given student ID via explicit query.
     */
    @Query("SELECT COUNT(u) > 0 FROM AppUser u WHERE u.student.studentId = :studentId")
    boolean existsByStudentId(@Param("studentId") Integer studentId);

    /**
     * Count total accounts possessing the specified system role (e.g., checking if any ROLE_ADMIN exists).
     */
    long countByRole(Role role);
}
