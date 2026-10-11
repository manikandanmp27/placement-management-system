import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Eye,
  Send,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  GraduationCap,
} from 'lucide-react';

import { jobsApi } from '../api/jobs';
import { companiesApi } from '../api/companies';
import { studentsApi } from '../api/students';
import { proceduresApi } from '../api/procedures';
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

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsData, companiesData, studentsData] = await Promise.all([
        jobsApi.getAll(),
        companiesApi.getAll().catch(() => []),
        studentsApi.getAll().catch(() => []),
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      console.error('Failed to load jobs data:', err);
      setError(err.message || 'Failed to fetch job records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    if (!applyJob || !selectedStudentId) {
      setApplyError('Please select a student to apply.');
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
        err.message || 'Application could not be processed due to eligibility or duplicate constraints.';
      setApplyError(errorMsg);
      toast.error(errorMsg, 'Application Ineligible');
    } finally {
      setIsApplying(false);
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
      </div>

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
              aria-label="Filter by company"
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
              aria-label="Filter by deadline status"
            >
              <option value="">All Deadlines</option>
              <option value="ACTIVE">Active Deadlines</option>
              <option value="EXPIRED">Expired Deadlines</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Openings: <strong>{filteredJobs.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Job Openings Found"
          description={
            searchQuery || companyFilter || statusFilter
              ? 'No jobs match your filter criteria. Try clearing the filters.'
              : 'There are currently no job opportunities posted.'
          }
          actionText="Post New Job"
          actionIcon={Plus}
          onAction={() => setIsCreateModalOpen(true)}
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
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Send}
                            onClick={() => handleOpenApply(job)}
                            disabled={expired}
                            title={expired ? 'Application deadline expired' : 'Apply for this job'}
                            id={`btn-apply-job-${job.jobId}`}
                          >
                            Apply
                          </Button>
                          <button
                            type="button"
                            className="icon-btn icon-btn-sm"
                            onClick={() => handleView(job)}
                            aria-label={`View details of ${job.jobTitle}`}
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
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

      <Modal
        isOpen={!!applyJob}
        onClose={() => setApplyJob(null)}
        title={`Apply Candidate for Job #${applyJob?.jobId}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setApplyJob(null)}
              disabled={isApplying}
            >
              Cancel
            </Button>
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
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.785rem' }}>
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
                    <strong>Procedure Error:</strong> {applyError}
                  </div>
                </div>
              )}

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
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Job Opening Details"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
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
