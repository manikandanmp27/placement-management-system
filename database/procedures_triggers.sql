-- Placement Status Trigger
/*When a new placement is inserted, MySQL should automatically change that student's placement_status to PLACED*/
USE campus_placement;

DELIMITER //

CREATE TRIGGER update_student_placement_status
AFTER INSERT ON placement
FOR EACH ROW
BEGIN
    UPDATE student
    SET placement_status = 'PLACED'
    WHERE student_id = NEW.student_id;
END //

DELIMITER ;

-- Application Deadline Trigger
/* preventing a student from applying to a job after its application deadline.*/
DELIMITER //

CREATE TRIGGER prevent_late_application
BEFORE INSERT ON application
FOR EACH ROW
BEGIN
    DECLARE job_deadline DATE;

    SELECT deadline
    INTO job_deadline
    FROM job
    WHERE job_id = NEW.job_id;

    IF CURDATE() > job_deadline THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Application deadline has passed';
    END IF;
END //

DELIMITER ;

-- ApplyForJob Stored Procedure
/*instead of letting the application process simply insert a row, 
you're creating a database procedure that performs the required checks first.*/

/*
The project specifies these checks: student exists, 
student is not already placed, deadline, CGPA, backlogs, 
department eligibility, duplicate application, 
then create the application.
*/
DROP PROCEDURE IF EXISTS ApplyForJob;

DELIMITER //

CREATE PROCEDURE ApplyForJob(
    IN p_student_id INT,
    IN p_job_id INT
)
BEGIN
    DECLARE student_count INT;
    DECLARE already_placed VARCHAR(20);
    DECLARE student_cgpa DECIMAL(3,2);
    DECLARE student_backlogs INT;
    DECLARE job_min_cgpa DECIMAL(3,2);
    DECLARE job_max_backlogs INT;
    DECLARE job_deadline DATE;
    DECLARE existing_application INT;
    DECLARE new_application_id INT;

    SELECT COUNT(*)
    INTO student_count
    FROM student
    WHERE student_id = p_student_id;

    IF student_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student does not exist';
    END IF;

    SELECT placement_status, cgpa, backlogs
    INTO already_placed, student_cgpa, student_backlogs
    FROM student
    WHERE student_id = p_student_id;

    IF already_placed = 'PLACED' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student is already placed';
    END IF;

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

    SELECT COUNT(*)
    INTO existing_application
    FROM application
    WHERE student_id = p_student_id
      AND job_id = p_job_id;

    IF existing_application > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student has already applied for this job';
    END IF;

    SELECT COALESCE(MAX(application_id), 300) + 1
    INTO new_application_id
    FROM application;

    INSERT INTO application
    (application_id, student_id, job_id, application_date, status)
    VALUES
    (new_application_id, p_student_id, p_job_id, CURDATE(), 'APPLIED');

END //

DELIMITER ;

-- Placement Statistics Procedure
/*creating a reusable procedure that gives placement statistics for a particular department.*/
DELIMITER //

CREATE PROCEDURE PlacementStatistics(
    IN p_department_id INT
)
BEGIN
    SELECT
        d.department_name,
        COUNT(DISTINCT s.student_id) AS total_students,
        COUNT(DISTINCT p.placement_id) AS students_placed,
        ROUND(
            COUNT(DISTINCT p.placement_id) * 100.0
            / NULLIF(COUNT(DISTINCT s.student_id), 0),
            2
        ) AS placement_percentage
    FROM department d
    LEFT JOIN student s
        ON d.department_id = s.department_id
    LEFT JOIN placement p
        ON s.student_id = p.student_id
    WHERE d.department_id = p_department_id
    GROUP BY d.department_id, d.department_name;
END //

DELIMITER ;