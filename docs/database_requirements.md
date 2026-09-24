## 5. Database Requirements

The Campus Placement Management System shall use MySQL as its relational
database management system. The database shall store and manage information
related to departments, students, companies, job opportunities, applications,
interviews, and final placements.

### 5.1 Main Database Tables

The database shall contain the following seven main tables:

1. DEPARTMENT
2. STUDENT
3. COMPANY
4. JOB
5. APPLICATION
6. INTERVIEW
7. PLACEMENT


### 5.2 Purpose of Each Table

#### 5.2.1 DEPARTMENT

The DEPARTMENT table shall store information about the academic departments
in the college.

It shall be used to:
- Maintain department information.
- Associate students with their respective departments.
- Support department-wise placement statistics.

Example departments may include CSE, ECE, EEE, etc.


#### 5.2.2 STUDENT

The STUDENT table shall store the academic and placement-related information
of students.

It shall be used to:
- Maintain student placement profiles.
- Store student academic information such as CGPA and backlogs.
- Associate students with departments.
- Track the placement status of students.
- Identify students who are eligible for particular jobs.

The table shall maintain information such as:
- Student ID
- Name
- Email
- Phone
- Department
- Graduation year
- CGPA
- Number of active backlogs
- Placement status


#### 5.2.3 COMPANY

The COMPANY table shall store information about companies participating in
the campus placement process.

It shall be used to:
- Maintain company records.
- Store company details.
- Associate companies with the job opportunities they offer.
- Support company-wise placement and selection statistics.

The table shall maintain information such as:
- Company ID
- Company name
- Industry
- Location
- Website


#### 5.2.4 JOB

The JOB table shall store job or placement opportunities offered by
companies.

It shall be used to:
- Maintain available job opportunities.
- Associate each job with a company.
- Store job details.
- Store the eligibility criteria required for applying.
- Control the application deadline.

The table shall maintain information such as:
- Job ID
- Company ID
- Job title
- Job type
- Package / CTC
- Minimum CGPA
- Maximum allowed backlogs
- Application deadline
- Job description

The eligibility criteria shall be stored as part of the JOB table instead of
creating a separate eligibility table.


#### 5.2.5 APPLICATION

The APPLICATION table shall store applications submitted by students for
job opportunities.

It shall be used to:
- Record which student applied for which job.
- Track the date of application.
- Track the current application status.
- Support the shortlisting and selection process.
- Connect students with job opportunities.

The table shall maintain information such as:
- Application ID
- Student ID
- Job ID
- Application date
- Application status

Possible application statuses are:
- Applied
- Shortlisted
- Rejected
- Selected

A student shall not be allowed to apply for the same job more than once.
Therefore, the combination of student_id and job_id shall be unique.


#### 5.2.6 INTERVIEW

The INTERVIEW table shall store information about interview and selection
rounds associated with student applications.

It shall be used to:
- Record different interview rounds.
- Track the type of interview round.
- Store interview dates.
- Record the result of each interview round.
- Support the recruitment workflow.

The table shall maintain information such as:
- Interview ID
- Application ID
- Round number
- Round type
- Interview date
- Result

Possible round types include:
- Aptitude
- Technical
- HR

Possible interview results include:
- Pending
- Passed
- Failed

A single application may have multiple interview rounds.


#### 5.2.7 PLACEMENT

The PLACEMENT table shall store the final placement information of
students who are selected.

It shall be used to:
- Record final placement details.
- Associate a student with the company where they are placed.
- Associate the placement with the corresponding job.
- Store the final package and joining information.
- Support placement statistics and reports.

The table shall maintain information such as:
- Placement ID
- Student ID
- Company ID
- Job ID
- Placement date
- Final package
- Joining date

A student should have only one active/final placement according to the
project's business rule.


### 5.3 Database Relationships

The database shall support the following relationships:

- DEPARTMENT → STUDENT = 1 : Many
- COMPANY → JOB = 1 : Many
- STUDENT → APPLICATION = 1 : Many
- JOB → APPLICATION = 1 : Many
- APPLICATION → INTERVIEW = 1 : Many
- STUDENT → PLACEMENT
- COMPANY → PLACEMENT = 1 : Many
- JOB → PLACEMENT = 1 : Many


### 5.4 Database Constraints

The database shall use appropriate constraints to maintain data integrity,
including:

- Primary Keys to uniquely identify records in each table.
- Foreign Keys to establish relationships between related tables.
- NOT NULL constraints for mandatory attributes.
- UNIQUE constraints to prevent duplicate data where required.
- CHECK constraints where appropriate to restrict invalid values.
- Appropriate indexes to improve query performance.


### 5.5 Data Integrity Requirements

The database shall maintain consistency between related records using
foreign-key relationships.

The following relationships shall be maintained:

- Students shall belong to valid departments.
- Jobs shall belong to valid companies.
- Applications shall belong to valid students and jobs.
- Interviews shall belong to valid applications.
- Placements shall belong to valid students, companies, and jobs.

The database shall prevent duplicate applications by enforcing uniqueness
on the combination of student_id and job_id.


### 5.6 Database Normalization

The database design shall be normalized up to Third Normal Form (3NF).

The design shall avoid:

- Repeating groups
- Partial dependencies
- Transitive dependencies
- Unnecessary duplication of data


### 5.7 Database Automation

The database shall support meaningful database-level automation using
triggers and stored procedures.

The system shall include:

1. A trigger to automatically update a student's placement status to
   'PLACED' when a placement record is created.

2. A trigger may be used to prevent applications from being created after
   the job application deadline.

3. An ApplyForJob(student_id, job_id) stored procedure shall perform the
   required checks before creating an application.

The procedure shall check:

- Whether the student exists.
- Whether the student is already placed.
- Whether the application deadline has passed.
- Whether the student's CGPA satisfies the job requirement.
- Whether the student's backlogs satisfy the job requirement.
- Whether the student's department is eligible.
- Whether the student has already applied for the job.

4. A stored procedure shall generate placement statistics for a department
   or graduating batch.


### 5.8 SQL Query Requirements

The database shall support the following basic operations:

- INSERT
- SELECT
- UPDATE
- DELETE

The system shall support queries for:

- Available jobs
- Eligible students
- Applications for a particular job
- Applications submitted by a student
- Shortlisted students
- Students placed in a particular company
- Highest package
- Average package
- Department-wise placement percentage
- Company-wise selection count
- Students who have not applied for any job
- Jobs with the highest number of applicants
- Students currently in the interview process

The project shall demonstrate the use of:

- JOIN
- GROUP BY
- HAVING
- Aggregate functions
- Subqueries
- Views
