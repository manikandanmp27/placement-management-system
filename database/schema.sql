CREATE DATABASE campus_placement;
USE campus_placement;
CREATE TABLE department(
	department_id INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE student(
	student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    department_id INT NOT NULL,
    graduation_year INT NOT NULL,
    cgpa DECIMAL(3,2) NOT NULL,
    backlogs INT DEFAULT 0,
    placement_status VARCHAR(20) DEFAULT 'NOT_PLACED',
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);

CREATE TABLE company(
	company_id INT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL UNIQUE,
    industry VARCHAR(100),
    location VARCHAR(100),
    website VARCHAR(255)
);

CREATE TABLE job(
	job_id INT PRIMARY KEY,
    company_id INT NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    job_type VARCHAR(50),
    package DECIMAL(10,2),
    min_cgpa DECIMAL(3,2),
    max_backlogs INT,
    deadline DATE,
    job_description TEXT,
    FOREIGN KEY (company_id) REFERENCES company(company_id)
);

CREATE TABLE application(
	application_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    job_id INT NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'APPLIED',
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id),
    UNIQUE (student_id,job_id)
);

CREATE TABLE interview (
    interview_id INT PRIMARY KEY,
    application_id INT NOT NULL,
    round_number INT NOT NULL,
    round_type VARCHAR(50),
    interview_date DATE,
    result VARCHAR(20),

    FOREIGN KEY (application_id) REFERENCES application(application_id)
);

CREATE TABLE placement (
	placement_id INT PRIMARY KEY,
    student_id INT NOT NULL,
    company_id INT NOT NULL,
    job_id INT NOT NULL,
    placement_date DATE NOT NULL,
    package DECIMAL(10,2),
    joining_date DATE,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    FOREIGN KEY (job_id) REFERENCES job(job_id)
);

SHOW TABLES;
DESCRIBE department;
DESCRIBE student;
DESCRIBE job;
DESCRIBE application;
DESCRIBE interview;
DESCRIBE company;
DESCRIBE placement;