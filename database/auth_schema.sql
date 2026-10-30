-- ============================================================================
-- Campus Placement Management System — Authentication & RBAC Schema
-- Script File: database/auth_schema.sql
-- Description: Creates the standalone `app_user` table for authentication.
-- Production Safety:
--   - Does NOT modify or recreate any existing project tables.
--   - Does NOT alter existing triggers or stored procedures.
--   - Does NOT insert any default users, seeds, or plain-text credentials.
-- Target Database: MySQL 8.0+ (InnoDB) / Aiven for MySQL
-- ============================================================================

USE campus_placement;

CREATE TABLE IF NOT EXISTS app_user (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    student_id INT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_app_user_role 
        CHECK (role IN ('ROLE_STUDENT', 'ROLE_PLACEMENT_OFFICER', 'ROLE_ADMIN')),
    CONSTRAINT fk_app_user_student 
        FOREIGN KEY (student_id) REFERENCES student(student_id) 
        ON DELETE SET NULL
);

-- Indexing for high-performance authentication lookups
CREATE INDEX idx_app_user_email ON app_user(email);
CREATE INDEX idx_app_user_role ON app_user(role);

-- ============================================================================
-- Application-Level Constraint Documentation:
-- 1. Student Account Roster Linking:
--    - When creating/registering an account with `role = 'ROLE_STUDENT'`, the
--      application layer MUST verify that `student_id` is NOT NULL and matches
--      an existing record in the `student` table with an identical email address.
--    - A student record can only be claimed once (`student_id` is UNIQUE).
-- 2. Staff Account Linking Exclusivity:
--    - Accounts created with `role = 'ROLE_PLACEMENT_OFFICER'` or `role = 'ROLE_ADMIN'`
--      MUST have `student_id = NULL`. Staff accounts do not represent academic students.
-- 3. Password Storage:
--    - Plain-text passwords must NEVER be persisted. Passwords must be salted
--      and hashed using BCrypt (cost factor >= 10) prior to insertion.
-- ============================================================================
