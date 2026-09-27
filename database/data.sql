USE campus_placement;

INSERT INTO department (department_id, department_name) VALUES
(1, 'Computer Science and Engineering'),
(2, 'Electronics and Communication Engineering'),
(3, 'Electrical and Electronics Engineering'),
(4, 'Mechanical Engineering'),
(5, 'Civil Engineering');

INSERT INTO company (company_id, company_name, industry, location, website) VALUES
(1, 'TCS', 'Information Technology', 'Bengaluru', 'https://www.tcs.com'),
(2, 'Infosys', 'Information Technology', 'Bengaluru', 'https://www.infosys.com'),
(3, 'Wipro', 'Information Technology', 'Bengaluru', 'https://www.wipro.com'),
(4, 'Accenture', 'Information Technology', 'Bengaluru', 'https://www.accenture.com'),
(5, 'Deloitte', 'Consulting', 'Bengaluru', 'https://www.deloitte.com');

INSERT INTO student
(student_id, name, email, phone, department_id, graduation_year, cgpa, backlogs, placement_status)
VALUES
(101, 'Aarav Sharma', 'aarav@example.com', '9876500001', 1, 2027, 8.70, 0, 'NOT_PLACED'),
(102, 'Ananya Rao', 'ananya@example.com', '9876500002', 1, 2027, 9.10, 0, 'NOT_PLACED'),
(103, 'Rahul Kumar', 'rahul@example.com', '9876500003', 2, 2027, 8.20, 1, 'NOT_PLACED'),
(104, 'Sneha Patel', 'sneha@example.com', '9876500004', 3, 2027, 7.90, 0, 'NOT_PLACED'),
(105, 'Vikram Singh', 'vikram@example.com', '9876500005', 4, 2027, 7.50, 2, 'NOT_PLACED'),
(106, 'Priya Nair', 'priya@example.com', '9876500006', 1, 2027, 8.90, 0, 'NOT_PLACED'),
(107, 'Karthik Reddy', 'karthik@example.com', '9876500007', 2, 2027, 8.40, 0, 'NOT_PLACED'),
(108, 'Meera Iyer', 'meera@example.com', '9876500008', 3, 2027, 9.00, 0, 'NOT_PLACED'),
(109, 'Arjun Das', 'arjun@example.com', '9876500009', 5, 2027, 7.80, 1, 'NOT_PLACED'),
(110, 'Neha Joshi', 'neha@example.com', '9876500010', 1, 2027, 8.60, 0, 'NOT_PLACED');

INSERT INTO job
(job_id, company_id, job_title, job_type, package, min_cgpa, max_backlogs, deadline, job_description)
VALUES
(201, 1, 'Software Engineer', 'Full Time', 800000.00, 7.50, 0, '2027-01-15', 'Software development role'),
(202, 1, 'System Engineer', 'Full Time', 600000.00, 7.00, 1, '2027-01-20', 'System development and support role'),
(203, 2, 'Software Developer', 'Full Time', 750000.00, 7.50, 0, '2027-01-25', 'Application development role'),
(204, 2, 'Data Analyst', 'Full Time', 700000.00, 7.00, 1, '2027-02-01', 'Data analysis and reporting role'),
(205, 3, 'Project Engineer', 'Full Time', 650000.00, 7.00, 1, '2027-02-05', 'Engineering and project role'),
(206, 4, 'Application Developer', 'Full Time', 850000.00, 8.00, 0, '2027-02-10', 'Application development role'),
(207, 4, 'Cloud Engineer', 'Full Time', 900000.00, 8.00, 0, '2027-02-15', 'Cloud infrastructure role'),
(208, 5, 'Technology Analyst', 'Full Time', 800000.00, 7.50, 0, '2027-02-20', 'Technology consulting role');

INSERT INTO application
(application_id, student_id, job_id, application_date, status)
VALUES
(301, 101, 201, '2026-10-01', 'APPLIED'),
(302, 102, 201, '2026-10-02', 'SHORTLISTED'),
(303, 103, 202, '2026-10-03', 'APPLIED'),
(304, 104, 203, '2026-10-04', 'SHORTLISTED'),
(305, 105, 205, '2026-10-05', 'REJECTED'),
(306, 106, 206, '2026-10-06', 'SHORTLISTED'),
(307, 107, 203, '2026-10-07', 'APPLIED'),
(308, 108, 204, '2026-10-08', 'SHORTLISTED'),
(309, 109, 205, '2026-10-09', 'APPLIED'),
(310, 110, 208, '2026-10-10', 'SELECTED'),
(311, 101, 203, '2026-10-11', 'APPLIED'),
(312, 102, 206, '2026-10-12', 'SHORTLISTED'),
(313, 103, 205, '2026-10-13', 'APPLIED'),
(314, 104, 207, '2026-10-14', 'APPLIED'),
(315, 106, 208, '2026-10-15', 'SELECTED'),
(316, 107, 207, '2026-10-16', 'APPLIED'),
(317, 108, 206, '2026-10-17', 'SHORTLISTED'),
(318, 109, 204, '2026-10-18', 'REJECTED'),
(319, 110, 201, '2026-10-19', 'SHORTLISTED'),
(320, 102, 207, '2026-10-20', 'APPLIED');

INSERT INTO interview
(interview_id, application_id, round_number, round_type, interview_date, result)
VALUES
(401, 302, 1, 'Technical', '2026-10-25', 'Passed'),
(402, 302, 2, 'HR', '2026-10-28', 'Pending'),
(403, 304, 1, 'Aptitude', '2026-10-26', 'Passed'),
(404, 304, 2, 'Technical', '2026-10-29', 'Passed'),
(405, 306, 1, 'Technical', '2026-10-27', 'Passed'),
(406, 308, 1, 'Aptitude', '2026-10-28', 'Passed'),
(407, 308, 2, 'HR', '2026-10-31', 'Pending'),
(408, 312, 1, 'Technical', '2026-11-01', 'Passed'),
(409, 315, 1, 'Technical', '2026-11-02', 'Passed'),
(410, 315, 2, 'HR', '2026-11-05', 'Passed'),
(411, 317, 1, 'Technical', '2026-11-03', 'Pending'),
(412, 319, 1, 'Technical', '2026-11-04', 'Passed');

INSERT INTO placement
(placement_id, student_id, company_id, job_id, placement_date, package, joining_date)
VALUES
(501, 110, 5, 208, '2026-11-10', 800000.00, '2027-07-01'),
(502, 106, 4, 208, '2026-11-12', 800000.00, '2027-07-01');

SELECT * FROM department;
SELECT * FROM company;
SELECT * FROM student;
SELECT * FROM job;
SELECT * FROM application;
SELECT * FROM interview;
SELECT * FROM placement;