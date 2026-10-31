import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Eye,
  Send,
  Building2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  User,
} from 'lucide-react';

import { jobsApi } from '../api/jobs';
import { companiesApi } from '../api/companies';
import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import { proceduresApi } from '../api/procedures';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import FormTextarea from '../components/forms/FormTextarea';
import { formatDate, formatSalary, isExpired } from '../utils/formatters';

export function JobsPage() {
  const toast = useToast();
  const { user, isStudent } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); 

  const [selectedJob, setSelectedJob] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [applyJob, setApplyJob] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const [formData, setFormData] = useState({
    jobId: '',
    companyId: '',
    jobTitle: '',
    jobType: 'Full Time',
    packageAmount: '',
    minCgpa: '7.0',
    maxBacklogs: '0',
    deadline: '',
    jobDescription: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isStudent) {
        const [jobsData, companiesData, appsData, profileData] = await Promise.all([
          jobsApi.getAll(),
          companiesApi.getAll().catch(() => []),
          applicationsApi.getAll().catch(() => []),
          user?.studentId ? studentsApi.getById(user.studentId).catch(() => null) : Promise.resolve(null),
        ]);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setUserApplications(Array.isArray(appsData) ? appsData : []);
        setStudentProfile(profileData);
      } else {
        const [jobsData, companiesData, studentsData] = await Promise.all([
          jobsApi.getAll(),
          companiesApi.getAll().catch(() => []),
          studentsApi.getAll().catch(() => []),
        ]);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      }
    } catch (err) {
      console.error('Failed to load jobs data:', err);
      setError(err.message || 'Failed to fetch job records.');
    } finally {
      setLoading(false);
    }
  }, [isStudent, user]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const userApplicationsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(userApplications)) {
      userApplications.forEach((app) => {
        const jId = app.job?.jobId || app.jobId;
        if (jId) {
          map[jId] = app;
        }
      });
    }
    return map;
  }, [userApplications]);

  const getEligibilityStatus = useCallback((job) => {
    if (!isStudent) return { eligible: true };

    const existingApp = userApplicationsMap[job.jobId];
    if (existingApp) {
      return {
        eligible: false,
        alreadyApplied: true,
        status: existingApp.status || 'APPLIED',
        reason: `Already applied (Status: ${existingApp.status || 'APPLIED'})`,
      };
    }

    const expired = isExpired(job.deadline);
    if (expired) {
      return {
        eligible: false,
        expired: true,
        reason: 'Application deadline has passed',
      };
    }

    if (studentProfile) {
      if (studentProfile.placementStatus === 'PLACED') {
        return {
          eligible: false,
          placed: true,
          reason: 'Already placed with an employer',
        };
      }
      if (job.minCgpa !== null && job.minCgpa !== undefined && studentProfile.cgpa < job.minCgpa) {
        return {
          eligible: false,
          cgpaFailed: true,
          reason: `CGPA (${studentProfile.cgpa}) is below required minimum (${job.minCgpa})`,
        };
      }
      if (job.maxBacklogs !== null && job.maxBacklogs !== undefined && studentProfile.backlogs > job.maxBacklogs) {
        return {
          eligible: false,
          backlogsFailed: true,
          reason: `Active backlogs (${studentProfile.backlogs}) exceed maximum allowed (${job.maxBacklogs})`,
        };
      }
    }

    return {
      eligible: true,
      reason: 'Meets all eligibility criteria',
    };
  }, [isStudent, userApplicationsMap, studentProfile]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        j.jobTitle?.toLowerCase().includes(q) ||
        j.company?.companyName?.toLowerCase().includes(q) ||
        j.jobType?.toLowerCase().includes(q) ||
        String(j.jobId).includes(q);

      const matchesCompany =
        !companyFilter ||
        String(j.company?.companyId) === String(companyFilter);

      const expired = isExpired(j.deadline);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'ACTIVE' && !expired) ||
        (statusFilter === 'EXPIRED' && expired);

      return matchesSearch && matchesCompany && matchesStatus;
    });
  }, [jobs, searchQuery, companyFilter, statusFilter]);

  const handleView = (job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      setIsDeleting(true);
      await jobsApi.delete(jobToDelete.jobId);
      toast.success(`Job opening "${jobToDelete.jobTitle}" was removed.`);
      setJobToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error(err.message || 'Cannot delete job with active student applications.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenApply = (job) => {
    setApplyJob(job);
    setSelectedStudentId('');
    setApplyError(null);
  };

  const handleApplyProcedure = async (e) => {
    e.preventDefault();

    if (isStudent) {
      if (!applyJob) return;
      const eligibility = getEligibilityStatus(applyJob);
      if (!eligibility.eligible) {
        setApplyError(eligibility.reason);
        return;
      }

      try {
        setIsApplying(true);
        setApplyError(null);

        // Student applies directly using authenticated principal (no frontend-supplied student ID)
        await proceduresApi.applyForJob(Number(applyJob.jobId));

        toast.success(
          `Application submitted successfully for Job #${applyJob.jobId} (${applyJob.jobTitle})!`
        );
        setApplyJob(null);
        loadData();
      } catch (err) {
        console.error('Apply procedure failed:', err);
        const errorMsg =
          err?.data || err?.message || 'Application could not be processed due to eligibility or duplicate constraints.';
        setApplyError(errorMsg);
        toast.error(errorMsg, 'Application Error');
      } finally {
        setIsApplying(false);
      }
    } else {
      // Officer / Admin flow
      if (!applyJob || !selectedStudentId) {
        setApplyError('Please select a student candidate to apply.');
        return;
      }

      try {
        setIsApplying(true);
        setApplyError(null);

        await proceduresApi.applyForJob(Number(selectedStudentId), Number(applyJob.jobId));

        toast.success(
          `Application submitted successfully for Job #${applyJob.jobId} (${applyJob.jobTitle})!`
        );
        setApplyJob(null);
        loadData();
      } catch (err) {
        console.error('Apply procedure failed:', err);
        const errorMsg =
          err?.data || err?.message || 'Application could not be processed due to eligibility or duplicate constraints.';
        setApplyError(errorMsg);
        toast.error(errorMsg, 'Application Ineligible');
      } finally {
        setIsApplying(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.jobId || isNaN(formData.jobId) || Number(formData.jobId) <= 0) {
      errors.jobId = 'Valid positive Job ID is required';
    }
    if (!formData.companyId) {
      errors.companyId = 'Hiring company must be selected';
    }
    if (!formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    if (formData.packageAmount === '' || isNaN(formData.packageAmount) || Number(formData.packageAmount) <= 0) {
      errors.packageAmount = 'Valid salary package amount is required';
    }
    if (formData.minCgpa === '' || isNaN(formData.minCgpa) || Number(formData.minCgpa) < 0 || Number(formData.minCgpa) > 10) {
      errors.minCgpa = 'Minimum CGPA must be between 0.00 and 10.00';
    }
    if (formData.maxBacklogs === '' || isNaN(formData.maxBacklogs) || Number(formData.maxBacklogs) < 0) {
      errors.maxBacklogs = 'Maximum backlogs cannot be negative';
    }
    if (!formData.deadline) {
      errors.deadline = 'Application deadline is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const selectedCompany = companies.find(
        (c) => String(c.companyId) === String(formData.companyId)
      );

      const payload = {
        jobId: Number(formData.jobId),
        company: {
          companyId: Number(formData.companyId),
          companyName: selectedCompany?.companyName || '',
        },
        jobTitle: formData.jobTitle.trim(),
        jobType: formData.jobType,
        packageAmount: parseFloat(Number(formData.packageAmount).toFixed(2)),
        minCgpa: parseFloat(Number(formData.minCgpa).toFixed(2)),
        maxBacklogs: Number(formData.maxBacklogs),
        deadline: formData.deadline,
        jobDescription: formData.jobDescription.trim() || null,
      };

      await jobsApi.create(payload);
      toast.success(`Job opening "${payload.jobTitle}" created successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        jobId: '',
        companyId: '',
        jobTitle: '',
        jobType: 'Full Time',
        packageAmount: '',
        minCgpa: '7.0',
        maxBacklogs: '0',
        deadline: '',
        jobDescription: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create job opening:', err);
      toast.error(err.message || 'Failed to create job. Please verify Job ID uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Job Opportunities
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Campus recruitment drives, compensation packages, eligibility criteria, and application submission.
          </p>
        </div>

        {!isStudent && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormErrors({});
              setIsCreateModalOpen(true);
            }}
            id="btn-post-job"
          >
            Post New Job
          </Button>
        )}
      </div>

      {/* Student Eligibility Profile Banner */}
      {isStudent && studentProfile && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-hover) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  {studentProfile.name}
                </h3>
                <span className="badge badge-neutral">ID #{studentProfile.studentId}</span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {studentProfile.department?.departmentName || 'Enrolled Student'} • Class of {studentProfile.graduationYear}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your CGPA
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {studentProfile.cgpa}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Backlogs
              </div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: studentProfile.backlogs > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                }}
              >
                {studentProfile.backlogs}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Placement Status
              </div>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={studentProfile.placementStatus} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Submitted Applications
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {Object.keys(userApplicationsMap).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search role, company, type..."
            id="job-search-input"
          />

          <div style={{ minWidth: 200 }}>
            <select
              className="form-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by Company"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Deadline Status"
            >
              <option value="">All Postings</option>
              <option value="ACTIVE">Active (Accepting)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Showing <strong>{filteredJobs.length}</strong> of <strong>{jobs.length}</strong> positions
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : error ? (
        <ErrorState
          title="Could Not Load Job Openings"
          message={error}
          onRetry={loadData}
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Job Openings Found"
          description={
            searchQuery || companyFilter || statusFilter
              ? 'No jobs match your filter criteria. Try clearing the filters.'
              : 'There are currently no job opportunities posted.'
          }
          actionText={!isStudent ? 'Post New Job' : undefined}
          actionIcon={!isStudent ? Plus : undefined}
          onAction={!isStudent ? () => setIsCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Title & Company</th>
                  <th>Type</th>
                  <th>Package (CTC)</th>
                  <th>Eligibility</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const expired = isExpired(job.deadline);
                  const eligibility = getEligibilityStatus(job);

                  return (
                    <tr key={job.jobId}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                        #{job.jobId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {job.jobTitle}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building2 size={12} />
                          <span>{job.company?.companyName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {job.jobType || 'Full Time'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                          {formatSalary(job.packageAmount)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)' }}>
                          <div>Min CGPA: <strong>{job.minCgpa ?? '—'}</strong></div>
                          <div>Max Backlogs: <strong>{job.maxBacklogs ?? 0}</strong></div>
                          
                          {/* Student Specific Eligibility Badge */}
                          {isStudent && (
                            <div style={{ marginTop: '0.35rem' }}>
                              {eligibility.alreadyApplied ? (
                                <span className="badge badge-info" title={eligibility.reason}>
                                  Applied: {eligibility.status}
                                </span>
                              ) : eligibility.expired ? (
                                <span className="badge badge-warning" title={eligibility.reason}>
                                  Deadline Passed
                                </span>
                              ) : eligibility.eligible ? (
                                <span className="badge badge-success">
                                  <CheckCircle2 size={11} /> Eligible
                                </span>
                              ) : (
                                <span className="badge badge-danger" title={eligibility.reason}>
                                  <AlertCircle size={11} /> Ineligible
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatDate(job.deadline)}
                          </span>
                          {expired ? (
                            <StatusBadge status="EXPIRED" />
                          ) : (
                            <StatusBadge status="ACTIVE" />
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Apply action button */}
                          {isStudent ? (
                            eligibility.alreadyApplied ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={CheckCircle2}
                                disabled
                                title={`Already applied (Status: ${eligibility.status})`}
                              >
                                Applied
                              </Button>
                            ) : eligibility.expired ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled
                                title="Application deadline has passed"
                              >
                                Expired
                              </Button>
                            ) : !eligibility.eligible ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled
                                title={eligibility.reason}
                              >
                                Ineligible
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={Send}
                                onClick={() => handleOpenApply(job)}
                                id={`btn-apply-job-${job.jobId}`}
                              >
                                Apply Now
                              </Button>
                            )
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Send}
                              onClick={() => handleOpenApply(job)}
                              disabled={expired}
                              title={expired ? 'Application deadline expired' : 'Apply candidate for this job'}
                              id={`btn-apply-job-${job.jobId}`}
                            >
                              Apply
                            </Button>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            className="icon-btn icon-btn-sm"
                            onClick={() => handleView(job)}
                            aria-label={`View details of ${job.jobTitle}`}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Delete action: Officer/Admin only */}
                          {!isStudent && (
                            <button
                              type="button"
                              className="icon-btn icon-btn-sm"
                              onClick={() => setJobToDelete(job)}
                              aria-label={`Delete job ${job.jobTitle}`}
                              title="Delete Job"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Candidate Modal */}
      <Modal
        isOpen={!!applyJob}
        onClose={() => setApplyJob(null)}
        title={isStudent ? `Apply for ${applyJob?.jobTitle}` : `Apply Candidate for Job #${applyJob?.jobId}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setApplyJob(null)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            {isStudent ? (
              <Button
                variant="primary"
                icon={Send}
                onClick={handleApplyProcedure}
                isLoading={isApplying}
                disabled={applyJob && !getEligibilityStatus(applyJob).eligible}
                id="submit-apply-procedure-btn"
              >
                Confirm & Submit Application
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Send}
                onClick={handleApplyProcedure}
                isLoading={isApplying}
                disabled={!selectedStudentId}
                id="submit-apply-procedure-btn"
              >
                Submit Application
              </Button>
            )}
          </>
        }
      >
        {applyJob && (
          <form onSubmit={handleApplyProcedure}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {applyJob.jobTitle}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Company: <strong>{applyJob.company?.companyName}</strong> • Package: <strong>{formatSalary(applyJob.packageAmount)}</strong>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.785rem', flexWrap: 'wrap' }}>
                  <span>Required CGPA: <strong>≥ {applyJob.minCgpa}</strong></span>
                  <span>Max Backlogs: <strong>≤ {applyJob.maxBacklogs}</strong></span>
                  <span>Deadline: <strong>{formatDate(applyJob.deadline)}</strong></span>
                </div>
              </div>

              {applyError && (
                <div
                  style={{
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    color: 'var(--color-danger-text)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Application Error:</strong> {applyError}
                  </div>
                </div>
              )}

              {/* Student specific confirmation vs Officer selection */}
              {isStudent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <User size={14} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Candidate Roll Information
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {studentProfile?.name || user?.email} (Student ID #{user?.studentId})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      CGPA: <strong>{studentProfile?.cgpa ?? '—'}</strong> • Active Backlogs: <strong>{studentProfile?.backlogs ?? '—'}</strong> • Placement Status: <strong>{studentProfile?.placementStatus ?? '—'}</strong>
                    </div>
                  </div>

                  {(() => {
                    const status = getEligibilityStatus(applyJob);
                    if (status.eligible) {
                      return (
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'var(--color-success-bg)',
                            border: '1px solid var(--color-success-border)',
                            color: 'var(--color-success-text)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                          <span>You meet all academic criteria (CGPA ≥ {applyJob.minCgpa}, backlogs ≤ {applyJob.maxBacklogs}) and are eligible to apply.</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: 'var(--color-danger-bg)',
                          border: '1px solid var(--color-danger-border)',
                          color: 'var(--color-danger-text)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>Ineligible to apply: {status.reason}</span>
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Your application will be submitted directly via the stored procedure using your authenticated student roll number.
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label" htmlFor="select-candidate-student">
                    Select Student Candidate <span className="form-required">*</span>
                  </label>
                  <select
                    id="select-candidate-student"
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setApplyError(null);
                    }}
                    required
                  >
                    <option value="" disabled>
                      Choose an enrolled student...
                    </option>
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} (ID: {s.studentId}) — CGPA: {s.cgpa}, Backlogs: {s.backlogs}, Status: {s.placementStatus}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Procedure executes verification: checks candidate existence, unplaced status, CGPA requirement, backlogs, and prevents duplicate applications.
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* View Job Opening Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Job Opening Details"
        size="lg"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {isStudent && selectedJob && (() => {
              const status = getEligibilityStatus(selectedJob);
              if (status.alreadyApplied) {
                return (
                  <Button variant="secondary" icon={CheckCircle2} disabled>
                    Applied ({status.status})
                  </Button>
                );
              }
              if (status.eligible) {
                return (
                  <Button
                    variant="primary"
                    icon={Send}
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenApply(selectedJob);
                    }}
                  >
                    Apply for this Job
                  </Button>
                );
              }
              return (
                <Button variant="secondary" disabled title={status.reason}>
                  Ineligible
                </Button>
              );
            })()}
          </div>
        }
      >
        {selectedJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedJob.jobTitle}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {selectedJob.company?.companyName} • ID #{selectedJob.jobId}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatSalary(selectedJob.packageAmount)}
                </div>
                <span className="badge badge-neutral">{selectedJob.jobType || 'Full Time'}</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                backgroundColor: 'var(--color-surface-hover)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Minimum CGPA
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px', color: 'var(--color-primary)' }}>
                  {selectedJob.minCgpa ?? 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Max Backlogs Allowed
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                  {selectedJob.maxBacklogs ?? 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Application Deadline
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>
                  {formatDate(selectedJob.deadline)}
                </div>
              </div>
            </div>

            {/* Student specific eligibility breakdown inside view modal */}
            {isStudent && (
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                  Your Eligibility Assessment
                </div>
                {(() => {
                  const status = getEligibilityStatus(selectedJob);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem' }}>
                      <div>
                        Status: <strong>{status.alreadyApplied ? `Already Applied (${status.status})` : status.eligible ? 'Eligible' : 'Ineligible'}</strong>
                      </div>
                      {!status.eligible && (
                        <div style={{ color: 'var(--color-danger)' }}>
                          Reason: {status.reason}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Role Description & Requirements
              </h4>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                {selectedJob.jobDescription || 'No description provided for this opening.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Post New Job Opening Modal: Officer/Admin only */}
      {!isStudent && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Post New Job Opening"
          size="lg"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateJob}
                isLoading={isSubmitting}
                id="submit-post-job-btn"
              >
                Publish Job
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateJob}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <FormInput
                label="Job ID"
                name="jobId"
                type="number"
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                placeholder="e.g. 209"
                required
                error={formErrors.jobId}
                helpText="Unique numeric job identifier"
              />

              <FormSelect
                label="Hiring Company"
                name="companyId"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                options={companies.map((c) => ({
                  value: c.companyId,
                  label: c.companyName,
                }))}
                required
                error={formErrors.companyId}
              />

              <FormInput
                label="Job Title / Role"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="e.g. Software Engineer"
                required
                error={formErrors.jobTitle}
              />

              <FormSelect
                label="Job Type"
                name="jobType"
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                options={[
                  { value: 'Full Time', label: 'Full Time' },
                  { value: 'Internship', label: 'Internship' },
                  { value: 'Contract', label: 'Contract' },
                ]}
                required
              />

              <FormInput
                label="Annual Package (CTC in INR)"
                name="packageAmount"
                type="number"
                step="1000"
                value={formData.packageAmount}
                onChange={(e) => setFormData({ ...formData, packageAmount: e.target.value })}
                placeholder="e.g. 800000"
                required
                error={formErrors.packageAmount}
                helpText="e.g. 800000 = ₹8.00 LPA"
              />

              <FormInput
                label="Minimum CGPA"
                name="minCgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.minCgpa}
                onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                placeholder="7.5"
                required
                error={formErrors.minCgpa}
              />

              <FormInput
                label="Maximum Backlogs"
                name="maxBacklogs"
                type="number"
                min="0"
                value={formData.maxBacklogs}
                onChange={(e) => setFormData({ ...formData, maxBacklogs: e.target.value })}
                placeholder="0"
                required
                error={formErrors.maxBacklogs}
              />

              <FormInput
                label="Application Deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
                error={formErrors.deadline}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <FormTextarea
                label="Job Description"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Describe requirements, responsibilities, and eligibility..."
                rows={3}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Job Opening"
        message={`Are you sure you want to delete job "${jobToDelete?.jobTitle}" (#${jobToDelete?.jobId})?`}
        confirmText="Delete Job"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default JobsPage;
