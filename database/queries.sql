-- List all avaialble jobs
SELECT * FROM job;

-- Combine jobs with companies
SELECT
    job.job_id,
    job.job_title,
    company.company_name,
    job.package,
    job.min_cgpa,
    job.deadline
FROM job
JOIN company
    ON job.company_id = company.company_id;

-- Find Eligible Students
SELECT
    student.student_id,
    student.name,
    student.cgpa,
    student.backlogs,
    job.job_title
FROM student
JOIN job
    ON student.cgpa >= job.min_cgpa
    AND student.backlogs <= job.max_backlogs;

-- Find applications foa particular job
SELECT
    application.application_id,
    student.name,
    job.job_title,
    application.application_date,
    application.status
FROM application
JOIN student
    ON application.student_id = student.student_id
JOIN job
    ON application.job_id = job.job_id
WHERE job.job_id = 201;

-- Find a student's aplication
SELECT
    application.application_id,
    job.job_title,
    company.company_name,
    application.application_date,
    application.status
FROM application
JOIN job
    ON application.job_id = job.job_id
JOIN company
    ON job.company_id = company.company_id
WHERE application.student_id = 101;

-- Find shortlisted students
SELECT
    student.student_id,
    student.name,
    job.job_title,
    application.status
FROM application
JOIN student
    ON application.student_id = student.student_id
JOIN job
    ON application.job_id = job.job_id
WHERE application.status = 'SHORTLISTED';

--Find students placed in a company
SELECT
    student.name,
    company.company_name,
    placement.package,
    placement.joining_date
FROM placement
JOIN student
    ON placement.student_id = student.student_id
JOIN company
    ON placement.company_id = company.company_id;

-- Find highest package
SELECT MAX(package) AS highest_package
FROM placement;

-- Find average package
SELECT AVG(package) AS average_package
FROM placement;

-- Department-wise placement count(group by)
SELECT
    department.department_name,
    COUNT(placement.placement_id) AS students_placed
FROM department
JOIN student
    ON department.department_id = student.department_id
LEFT JOIN placement
    ON student.student_id = placement.student_id
GROUP BY department.department_id, department.department_name;

-- Companies with multiple placements:finding companies that have selected more than one student.
SELECT
    company.company_name,
    COUNT(placement.placement_id) AS selection_count
FROM company
JOIN placement
    ON company.company_id = placement.company_id
GROUP BY company.company_id, company.company_name
HAVING COUNT(placement.placement_id) > 1;

-- Students who haven't applied for any job(sub query)
SELECT
    student.student_id,
    student.name
FROM student
WHERE student.student_id NOT IN (
    SELECT application.student_id
    FROM application
);

-- Jobs with the highest number of applicants
/*counting how many students applied for each job and 
displaying the jobs from highest to lowest number of applicants.*/
SELECT
    job.job_id,
    job.job_title,
    COUNT(application.application_id) AS applicant_count
FROM job
JOIN application
    ON job.job_id = application.job_id
GROUP BY job.job_id, job.job_title
ORDER BY applicant_count DESC;

-- Students currently in the interview process
SELECT
    student.student_id,
    student.name,
    job.job_title,
    interview.round_type,
    interview.result
FROM interview
JOIN application
    ON interview.application_id = application.application_id
JOIN student
    ON application.student_id = student.student_id
JOIN job
    ON application.job_id = job.job_id
WHERE interview.result = 'Pending';

-- Create a view:creating a reusable virtual table containing useful placement information.

CREATE VIEW placement_details AS
SELECT
    student.name AS student_name,
    company.company_name,
    job.job_title,
    placement.package,
    placement.placement_date,
    placement.joining_date
FROM placement
JOIN student
    ON placement.student_id = student.student_id
JOIN company
    ON placement.company_id = company.company_id
JOIN job
    ON placement.job_id = job.job_id;

SELECT * FROM placement_details;
