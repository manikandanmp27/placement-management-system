-- ============================================================================
-- Campus Placement Management System — Safe Student Archive Migration
-- Script File: database/migration_student_archive.sql
-- Description:
--   Adds safe soft-archiving support to the `student` table.
--   Preserves all historical records (applications, interviews, placements).
-- Target Database: MySQL 8.0+ (InnoDB) / Aiven for MySQL
--
-- Safety Notice:
--   - This migration is idempotent and non-destructive.
--   - Does NOT delete or drop any existing tables or rows.
--   - Adds `is_archived` column with DEFAULT FALSE for backwards compatibility.
--   - DO NOT execute against Aiven or hosted database until planned maintenance.
-- ============================================================================

USE campus_placement;

-- 1. Add `is_archived` column to `student` table with default value FALSE (active)
ALTER TABLE student
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create index on `is_archived` for high-performance roster filtering
CREATE INDEX idx_student_is_archived ON student(is_archived);

-- 3. Update `ApplyForJob` stored procedure to disallow applications for archived students
DROP PROCEDURE IF EXISTS ApplyForJob;

DELIMITER //

CREATE PROCEDURE ApplyForJob(
    IN p_student_id INT,
    IN p_job_id INT
)
BEGIN
    DECLARE student_count INT;
    DECLARE is_student_archived BOOLEAN;
    DECLARE already_placed VARCHAR(20);
    DECLARE student_cgpa DECIMAL(3,2);
    DECLARE student_backlogs INT;
    DECLARE job_min_cgpa DECIMAL(3,2);
    DECLARE job_max_backlogs INT;
    DECLARE job_deadline DATE;
    DECLARE existing_application INT;
    DECLARE new_application_id INT;

    -- Validate student existence
    SELECT COUNT(*)
    INTO student_count
    FROM student
    WHERE student_id = p_student_id;

    IF student_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student does not exist';
    END IF;

    -- Retrieve student status, archive state, and academic performance
    SELECT is_archived, placement_status, cgpa, backlogs
    INTO is_student_archived, already_placed, student_cgpa, student_backlogs
    FROM student
    WHERE student_id = p_student_id;

    -- Block archived students from applying for jobs
    IF is_student_archived = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Archived students are not eligible to apply for jobs';
    END IF;

    -- Block already placed students
    IF already_placed = 'PLACED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is already placed';
    END IF;

    -- Validate job cutoff criteria and application deadline
    SELECT min_cgpa, max_backlogs, deadline
    INTO job_min_cgpa, job_max_backlogs, job_deadline
    FROM job
    WHERE job_id = p_job_id;

    IF CURDATE() > job_deadline THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Application deadline has passed';
    END IF;

    IF student_cgpa < job_min_cgpa THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student does not meet CGPA requirement';
    END IF;

    IF student_backlogs > job_max_backlogs THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student has too many backlogs';
    END IF;

    -- Prevent duplicate applications
    SELECT COUNT(*)
    INTO existing_application
    FROM application
    WHERE student_id = p_student_id
      AND job_id = p_job_id;

    IF existing_application > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student has already applied for this job';
    END IF;

    -- Generate sequence ID and insert application
    SELECT COALESCE(MAX(application_id), 300) + 1
    INTO new_application_id
    FROM application;

    INSERT INTO application
    (application_id, student_id, job_id, application_date, status)
    VALUES
    (new_application_id, p_student_id, p_job_id, CURDATE(), 'APPLIED');

END //

DELIMITER ;

-- ============================================================================
-- Verification Queries (For post-migration check):
--   DESCRIBE student;
--   SELECT student_id, name, is_archived FROM student LIMIT 5;
--   SHOW CREATE PROCEDURE ApplyForJob;
-- ============================================================================
