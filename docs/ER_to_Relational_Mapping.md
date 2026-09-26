```md
# ER to Relational Mapping

## 1. DEPARTMENT

```text
DEPARTMENT(
    department_id PRIMARY KEY,
    department_name
)
```

**Purpose:**  
Stores information about the academic departments in the college.

---

## 2. STUDENT

```text
STUDENT(
    student_id PRIMARY KEY,
    name,
    email,
    phone,
    department_id FOREIGN KEY,
    graduation_year,
    cgpa,
    backlogs,
    placement_status
)
```

**Foreign Key Relationship:**

```text
student.department_id references department.department_id
```

**Purpose:**  
Stores the academic and placement-related information of students.

---

## 3. COMPANY

```text
COMPANY(
    company_id PRIMARY KEY,
    company_name,
    industry,
    location,
    website
)
```

**Purpose:**  
Stores information about companies participating in the campus placement
process.

---

## 4. JOB

```text
JOB(
    job_id PRIMARY KEY,
    company_id FOREIGN KEY,
    job_title,
    job_type,
    package,
    min_cgpa,
    max_backlogs,
    deadline,
    job_description
)
```

**Foreign Key Relationship:**

```text
job.company_id references company.company_id
```

**Purpose:**  
Stores job opportunities offered by companies, along with the eligibility
criteria required for students to apply.

---

## 5. APPLICATION

```text
APPLICATION(
    application_id PRIMARY KEY,
    student_id FOREIGN KEY,
    job_id FOREIGN KEY,
    application_date,
    status
)
```

**Foreign Key Relationships:**

```text
application.student_id references student.student_id

application.job_id references job.job_id
```

**Additional Constraint:**

```text
The combination of student_id and job_id shall be UNIQUE.
```

**Purpose:**  
Stores the applications submitted by students for job opportunities.

It records which student applied for which job, when the application was
submitted, and the current application status.

**Possible application statuses:**

```text
Applied
Shortlisted
Rejected
Selected
```

---

## 6. INTERVIEW

```text
INTERVIEW(
    interview_id PRIMARY KEY,
    application_id FOREIGN KEY,
    round_number,
    round_type,
    interview_date,
    result
)
```

**Foreign Key Relationship:**

```text
interview.application_id references application.application_id
```

**Purpose:**  
Stores the interview and selection-round information associated with a
student's job application.

A single application can have multiple interview rounds.

**Possible round types:**

```text
Aptitude
Technical
HR
```

**Possible interview results:**

```text
Pending
Passed
Failed
```

---

## 7. PLACEMENT

```text
PLACEMENT(
    placement_id PRIMARY KEY,
    student_id FOREIGN KEY,
    company_id FOREIGN KEY,
    job_id FOREIGN KEY,
    placement_date,
    package,
    joining_date
)
```

**Foreign Key Relationships:**

```text
placement.student_id references student.student_id

placement.company_id references company.company_id

placement.job_id references job.job_id
```

**Purpose:**  
Stores the final placement information of a student who has been selected.

It records the student, company, job, placement date, final package, and
joining date.

**Business Rule:**

```text
A student should have only one active/final placement.
```

---

# Relationships

```text
DEPARTMENT 1 ─────────── Many STUDENT

COMPANY 1 ────────────── Many JOB

STUDENT 1 ────────────── Many APPLICATION

JOB 1 ────────────────── Many APPLICATION

APPLICATION 1 ────────── Many INTERVIEW

STUDENT 1 ────────────── Many PLACEMENT

COMPANY 1 ────────────── Many PLACEMENT

JOB 1 ────────────────── Many PLACEMENT
```

