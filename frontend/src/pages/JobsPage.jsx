import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  Send,
  Building2,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Info,
  X,
  RefreshCw,
} from 'lucide-react';

import { jobsApi } from '../api/jobs';
import { companiesApi } from '../api/companies';
import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import { proceduresApi } from '../api/procedures';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { Card } from '../components/common/Card';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge, CategoryTag } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { formatDate, formatSalary, isExpired } from '../utils/formatters';

export function JobsPage() {
  const { toast } = useToast();
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

  // Ineligibility popover active job ID
  const [ineligibilityPopoverJobId, setIneligibilityPopoverJobId] = useState(null);
  const popoverRef = useRef(null);

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

  // Click outside listener for ineligibility popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIneligibilityPopoverJobId(null);
      }
    };
    if (ineligibilityPopoverJobId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ineligibilityPopoverJobId]);

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
      const reasons = [];
      if (job.minCgpa !== null && job.minCgpa !== undefined && studentProfile.cgpa < job.minCgpa) {
        reasons.push(`CGPA (${studentProfile.cgpa}) is below required minimum (${job.minCgpa})`);
      }
      if (job.maxBacklogs !== null && job.maxBacklogs !== undefined && studentProfile.backlogs > job.maxBacklogs) {
        reasons.push(`Active backlogs (${studentProfile.backlogs}) exceed maximum allowed (${job.maxBacklogs})`);
      }
      if (reasons.length > 0) {
        return {
          eligible: false,
          reasons,
          reason: reasons.join(' · '),
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
      await loadData();
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

        // Student applies directly using authenticated principal
        await proceduresApi.applyForJob(Number(applyJob.jobId));

        toast.success(`Application submitted successfully for "${applyJob.jobTitle}"!`);
        setApplyJob(null);
        await loadData();
      } catch (err) {
        console.error('Apply procedure failed:', err);
        const errorMsg =
          err?.data || err?.message || 'Application could not be processed due to eligibility or duplicate constraints.';
        setApplyError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsApplying(false);
      }
    } else {
      if (!applyJob || !selectedStudentId) {
        setApplyError('Please select a student candidate to apply.');
        return;
      }

      try {
        setIsApplying(true);
        setApplyError(null);

        await proceduresApi.applyForJob(Number(selectedStudentId), Number(applyJob.jobId));

        toast.success(`Application submitted for student #${selectedStudentId} to "${applyJob.jobTitle}"!`);
        setApplyJob(null);
        await loadData();
      } catch (err) {
        console.error('Apply procedure failed:', err);
        const errorMsg =
          err?.data || err?.message || 'Application could not be processed due to eligibility or duplicate constraints.';
        setApplyError(errorMsg);
        toast.error(errorMsg);
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
      await loadData();
    } catch (err) {
      console.error('Failed to create job opening:', err);
      toast.error(err.message || 'Failed to create job. Please verify Job ID uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">
            Campus recruitment drives, compensation packages, and eligibility criteria.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh job openings"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {!isStudent && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
              id="btn-post-job"
            >
              <Plus size={16} />
              <span>Post Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Eligibility Profile Banner */}
      {isStudent && studentProfile && (
        <div
          className="alert alert-info"
          style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <GraduationCap size={18} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                Your Academic Profile:
              </span>
              <span className="badge badge-neutral" style={{ fontVariantNumeric: 'tabular-nums' }}>
                CGPA: <strong>{studentProfile.cgpa}</strong>
              </span>
              <span className={`badge ${studentProfile.backlogs > 0 ? 'badge-danger' : 'badge-success'}`}>
                {studentProfile.backlogs} {studentProfile.backlogs === 1 ? 'Backlog' : 'Backlogs'}
              </span>
              <span className="badge badge-neutral">
                {studentProfile.department?.departmentName || 'General'}
              </span>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Applications Submitted: <strong style={{ color: 'var(--color-text-primary)' }}>{Object.keys(userApplicationsMap).length}</strong>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
            Eligibility is automatically evaluated against each recruitment drive's minimum CGPA and maximum backlog limits.
          </p>
        </div>
      )}

      {/* Main Content Card */}
      <Card>
        {/* FilterBar */}
        <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by role, company, type..."
            className="filter-search"
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
              aria-label="Filter by Status"
            >
              <option value="">All Postings</option>
              <option value="ACTIVE">Active (Accepting)</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {(searchQuery || companyFilter || statusFilter) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setCompanyFilter('');
                setStatusFilter('');
              }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredJobs.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{jobs.length}</strong> positions
          </div>
        </div>

        {/* State Management */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : error ? (
          <ErrorState
            title="Couldn't load job opportunities"
            message={error}
            onRetry={loadData}
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            title={searchQuery || companyFilter || statusFilter ? 'No matching jobs' : 'No job drives listed'}
            message={
              searchQuery || companyFilter || statusFilter
                ? 'No jobs match your filter criteria. Try clearing the search or filters.'
                : isStudent
                ? 'No recruitment drives are currently active. Check back soon for upcoming campus visits.'
                : 'There are currently no job opportunities posted. Post a new drive above.'
            }
            action={
              searchQuery || companyFilter || statusFilter ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCompanyFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear filters
                </button>
              ) : !isStudent ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={15} />
                  <span>Post Job</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Desktop Table View (≥768px) */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '240px' }}>Job & Company</th>
                    <th style={{ width: '120px' }}>Type</th>
                    <th className="col-numeric" style={{ width: '130px', textAlign: 'right' }}>Package (CTC)</th>
                    <th style={{ width: '180px' }}>Eligibility Criteria</th>
                    <th className="col-date" style={{ width: '140px' }}>Deadline</th>
                    <th className="col-actions" style={{ width: isStudent ? '160px' : '150px', textAlign: 'right' }}>Status & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => {
                    const expired = isExpired(job.deadline);
                    const eligibility = getEligibilityStatus(job);
                    const isPopoverOpen = ineligibilityPopoverJobId === job.jobId;

                    return (
                      <tr key={job.jobId}>
                        {/* 1. Job & Company */}
                        <td style={{ minWidth: '240px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                            {job.jobTitle}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: '2px', flexWrap: 'wrap' }}>
                            <Building2 size={12} style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{job.company?.companyName}</span>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>#{job.jobId}</span>
                          </div>
                        </td>

                        {/* 2. Type */}
                        <td style={{ width: '120px' }}>
                          <CategoryTag label={job.jobType || 'Full Time'} />
                        </td>

                        {/* 3. Package (CTC) */}
                        <td className="col-numeric" style={{ width: '130px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)' }}>
                              {formatSalary(job.packageAmount)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>CTC / annum</span>
                          </div>
                        </td>

                        {/* 4. Eligibility Criteria */}
                        <td style={{ width: '180px' }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>Min CGPA:</span>
                              <strong style={{ color: 'var(--color-text-primary)' }}>{job.minCgpa != null ? Number(job.minCgpa).toFixed(1) : '0.0'}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>Max Backlogs:</span>
                              <strong style={{ color: 'var(--color-text-primary)' }}>{job.maxBacklogs ?? 0}</strong>
                            </div>
                          </div>
                        </td>

                        {/* 5. Deadline */}
                        <td className="col-date" style={{ width: '140px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: expired ? 'var(--color-danger-600)' : 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                              {formatDate(job.deadline)}
                            </span>
                            <div>
                              {expired ? (
                                <StatusBadge status="EXPIRED" />
                              ) : (
                                <StatusBadge status="ACTIVE" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Status & Actions */}
                        <td className="col-actions" style={{ width: isStudent ? '160px' : '150px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'flex-end', position: 'relative' }}>
                            {isStudent ? (
                              eligibility.alreadyApplied ? (
                                <StatusBadge status={eligibility.status} />
                              ) : expired ? (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Closed</span>
                              ) : !eligibility.eligible ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                  <StatusBadge status="REJECTED" label="Ineligible" />
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px', height: '24px', width: '24px' }}
                                    onClick={() => setIneligibilityPopoverJobId(isPopoverOpen ? null : job.jobId)}
                                    title="View ineligibility reason"
                                    aria-label="View ineligibility details"
                                  >
                                    <Info size={14} style={{ color: 'var(--color-danger-600)' }} />
                                  </button>

                                  {/* Ineligibility Popover */}
                                  {isPopoverOpen && (
                                    <div
                                      ref={popoverRef}
                                      className="popover"
                                      style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        zIndex: 40,
                                        backgroundColor: 'var(--color-surface-elevated)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-3)',
                                        padding: 'var(--space-3)',
                                        width: '260px',
                                        textAlign: 'left',
                                        marginTop: '4px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-danger-600)' }}>
                                          Ineligibility Assessment
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ padding: 2, height: 20, width: 20 }}
                                          onClick={() => setIneligibilityPopoverJobId(null)}
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                      <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {(eligibility.reasons || [eligibility.reason]).map((r, idx) => (
                                          <li key={idx}>{r}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenApply(job)}
                                  id={`btn-apply-job-${job.jobId}`}
                                >
                                  <Send size={13} />
                                  <span>Apply</span>
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenApply(job)}
                                disabled={expired}
                                title={expired ? 'Application deadline expired' : 'Apply candidate'}
                                id={`btn-apply-job-${job.jobId}`}
                              >
                                <Send size={13} />
                                <span>Apply</span>
                              </button>
                            )}

                            {/* View details button */}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleView(job)}
                              aria-label={`View details of ${job.jobTitle}`}
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Delete action for Officer/Admin */}
                            {!isStudent && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => setJobToDelete(job)}
                                aria-label={`Delete job ${job.jobTitle}`}
                                title="Delete job"
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

            {/* Mobile Data Cards View (<768px) */}
            <div className="data-card-list">
              {filteredJobs.map((job) => {
                const expired = isExpired(job.deadline);
                const eligibility = getEligibilityStatus(job);

                return (
                  <div key={job.jobId} className="data-card">
                    <div className="data-card-header">
                      <div>
                        <div className="data-card-title">{job.jobTitle}</div>
                        <div className="data-card-subtitle">{job.company?.companyName} • #{job.jobId}</div>
                      </div>
                      <div className="data-card-badge">
                        {isStudent ? (
                          eligibility.alreadyApplied ? (
                            <StatusBadge status={eligibility.status} />
                          ) : expired ? (
                            <StatusBadge status="EXPIRED" />
                          ) : eligibility.eligible ? (
                            <StatusBadge status="ACTIVE" label="Eligible" />
                          ) : (
                            <StatusBadge status="REJECTED" label="Ineligible" />
                          )
                        ) : (
                          <StatusBadge status={expired ? 'EXPIRED' : 'ACTIVE'} />
                        )}
                      </div>
                    </div>

                    <div className="data-card-grid">
                      <div className="data-card-field">
                        <div className="data-card-field-label">Package (CTC)</div>
                        <div className="data-card-field-value" style={{ fontWeight: 600 }}>
                          {formatSalary(job.packageAmount)}
                        </div>
                      </div>
                      <div className="data-card-field">
                        <div className="data-card-field-label">Type</div>
                        <div className="data-card-field-value">
                          <CategoryTag label={job.jobType || 'Full Time'} />
                        </div>
                      </div>
                      <div className="data-card-field">
                        <div className="data-card-field-label">Criteria</div>
                        <div className="data-card-field-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          ≥ {job.minCgpa} CGPA • ≤ {job.maxBacklogs} BL
                        </div>
                      </div>
                      <div className="data-card-field">
                        <div className="data-card-field-label">Deadline</div>
                        <div className="data-card-field-value">
                          {formatDate(job.deadline)}
                        </div>
                      </div>
                    </div>

                    <div className="data-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleView(job)}
                        style={{ flex: 1 }}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
                      </button>

                      {isStudent ? (
                        eligibility.eligible && !expired && !eligibility.alreadyApplied && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenApply(job)}
                            style={{ flex: 1 }}
                          >
                            <Send size={14} />
                            <span>Apply Now</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenApply(job)}
                          disabled={expired}
                          style={{ flex: 1 }}
                        >
                          <Send size={14} />
                          <span>Apply</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Apply Candidate Modal */}
      {applyJob && (
        <Modal
          isOpen={!!applyJob}
          onClose={() => !isApplying && setApplyJob(null)}
          title={isStudent ? `Apply for ${applyJob.jobTitle}` : `Apply Candidate for Job #${applyJob.jobId}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApplyJob(null)}
                disabled={isApplying}
              >
                Cancel
              </button>
              {isStudent ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyProcedure}
                  disabled={isApplying || !getEligibilityStatus(applyJob).eligible}
                  id="submit-apply-procedure-btn"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Confirm & Apply</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyProcedure}
                  disabled={isApplying || !selectedStudentId}
                  id="submit-apply-procedure-btn"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          }
        >
          <form onSubmit={handleApplyProcedure}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Job summary card */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>
                  {applyJob.jobTitle}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                  Hiring Company: <strong>{applyJob.company?.companyName}</strong> • Package: <strong>{formatSalary(applyJob.packageAmount)}</strong>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
                  <span>Min CGPA: <strong>≥ {applyJob.minCgpa}</strong></span>
                  <span>Max Backlogs: <strong>≤ {applyJob.maxBacklogs}</strong></span>
                  <span>Deadline: <strong>{formatDate(applyJob.deadline)}</strong></span>
                </div>
              </div>

              {applyError && (
                <div className="alert alert-danger" role="alert">
                  <AlertCircle size={16} />
                  <span>{applyError}</span>
                </div>
              )}

              {/* Student specific confirmation vs Officer selection */}
              {isStudent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {(() => {
                    const status = getEligibilityStatus(applyJob);
                    if (status.eligible) {
                      return (
                        <div className="alert alert-success">
                          <CheckCircle2 size={16} />
                          <span>
                            You meet all academic criteria (CGPA ≥ {applyJob.minCgpa}, backlogs ≤ {applyJob.maxBacklogs}) and are eligible to apply.
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="alert alert-danger">
                        <AlertCircle size={16} />
                        <span>Ineligible to apply: {status.reason}</span>
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Your application will be submitted directly via verified stored procedure using your student profile credentials.
                  </div>
                </div>
              ) : (
                <FormSelect
                  label="Select Student Candidate"
                  name="candidateStudent"
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setApplyError(null);
                  }}
                  options={students.map((s) => ({
                    value: s.studentId,
                    label: `${s.name} (ID: ${s.studentId}) — CGPA: ${s.cgpa}, Backlogs: ${s.backlogs}, Status: ${s.placementStatus}`,
                  }))}
                  required
                  helperText="Stored procedure validates CGPA, backlogs, and checks for existing active applications."
                />
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* View Job Opening Modal (lg) */}
      {isViewModalOpen && selectedJob && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Job Opening Details"
          size="lg"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              {isStudent && (() => {
                const status = getEligibilityStatus(selectedJob);
                if (status.alreadyApplied) {
                  return (
                    <button type="button" className="btn btn-secondary" disabled>
                      Applied ({status.status})
                    </button>
                  );
                }
                if (status.eligible) {
                  return (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleOpenApply(selectedJob);
                      }}
                    >
                      <Send size={15} />
                      <span>Apply for this Job</span>
                    </button>
                  );
                }
                return (
                  <button type="button" className="btn btn-secondary" disabled title={status.reason}>
                    Ineligible
                  </button>
                );
              })()}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>{selectedJob.jobTitle}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {selectedJob.company?.companyName} • ID #{selectedJob.jobId}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary-600)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatSalary(selectedJob.packageAmount)}
                </div>
                <CategoryTag label={selectedJob.jobType || 'Full Time'} />
              </div>
            </div>

            {/* Definition Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-3)',
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Minimum CGPA
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {selectedJob.minCgpa ?? 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Max Backlogs
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {selectedJob.maxBacklogs ?? 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Application Deadline
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  {formatDate(selectedJob.deadline)}
                </div>
              </div>
            </div>

            {/* Student specific eligibility breakdown */}
            {isStudent && (
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-text-primary)' }}>
                  Your Eligibility Assessment
                </div>
                {(() => {
                  const status = getEligibilityStatus(selectedJob);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)' }}>
                      <div>
                        Status: <strong>{status.alreadyApplied ? `Already Applied (${status.status})` : status.eligible ? 'Eligible' : 'Ineligible'}</strong>
                      </div>
                      {!status.eligible && (
                        <div style={{ color: 'var(--color-danger-600)' }}>
                          Reason: {status.reason}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Formatted Job Description */}
            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                Role Description & Requirements
              </h4>
              <div
                style={{
                  maxWidth: '65ch',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.6,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'var(--color-surface-hover)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {selectedJob.jobDescription || 'No description provided for this opening.'}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Post New Job Opening Modal (lg) */}
      {!isStudent && isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Post New Job Opening"
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateJob}
                disabled={isSubmitting}
                id="submit-post-job-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Publishing…</span>
                  </>
                ) : (
                  <span>Publish Job</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateJob}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              <FormInput
                label="Job ID"
                name="jobId"
                type="number"
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                placeholder="e.g. 209"
                required
                error={formErrors.jobId}
                helperText="Unique numeric job identifier"
                min={1}
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
                helperText="e.g. 800000 = ₹8.00 LPA"
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

            <div style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label" htmlFor="job-description-field">
                Role Description
              </label>
              <textarea
                id="job-description-field"
                className="form-textarea"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Describe role responsibilities, team, skills required..."
                rows={4}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      {jobToDelete && !isStudent && (
        <ConfirmDialog
          isOpen={!!jobToDelete}
          onClose={() => !isDeleting && setJobToDelete(null)}
          onConfirm={handleDelete}
          title="Delete this job opening?"
          type="danger"
          confirmLabel="Delete Job"
          confirmLoading={isDeleting}
          message={`Are you sure you want to delete job "${jobToDelete.jobTitle}" (ID #${jobToDelete.jobId})? Active applications may block this deletion.`}
        />
      )}
    </div>
  );
}

export default JobsPage;

