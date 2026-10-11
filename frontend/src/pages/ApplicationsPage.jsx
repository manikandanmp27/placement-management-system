import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Building2,
  Calendar,
  GraduationCap,
  Briefcase,
  User,
} from 'lucide-react';

import { applicationsApi } from '../api/applications';
import { studentsApi } from '../api/students';
import { jobsApi } from '../api/jobs';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import { formatDate, formatSalary } from '../utils/formatters';

const APPLICATION_STATUSES = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];

export function ApplicationsPage() {
  const toast = useToast();

  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    applicationId: '',
    studentId: '',
    jobId: '',
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'APPLIED',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsData, studentsData, jobsData] = await Promise.all([
        applicationsApi.getAll(),
        studentsApi.getAll().catch(() => []),
        jobsApi.getAll().catch(() => []),
      ]);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Failed to load application records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.student?.name?.toLowerCase().includes(q) ||
        String(app.student?.studentId).includes(q) ||
        app.job?.jobTitle?.toLowerCase().includes(q) ||
        app.job?.company?.companyName?.toLowerCase().includes(q) ||
        String(app.applicationId).includes(q);

      const matchesStatus =
        !statusFilter ||
        app.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredApps.length / pageSize) || 1;
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleView = (app) => {
    setSelectedApp(app);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!appToDelete) return;
    try {
      setIsDeleting(true);
      await applicationsApi.delete(appToDelete.applicationId);
      toast.success(`Application #${appToDelete.applicationId} was removed.`);
      setAppToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete application:', err);
      toast.error(err.message || 'Cannot delete application with associated interview rounds.');
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.applicationId || isNaN(formData.applicationId) || Number(formData.applicationId) <= 0) {
      errors.applicationId = 'Valid positive Application ID is required';
    }
    if (!formData.studentId) {
      errors.studentId = 'Student must be selected';
    }
    if (!formData.jobId) {
      errors.jobId = 'Job opening must be selected';
    }
    if (!formData.applicationDate) {
      errors.applicationDate = 'Application date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const studentObj = students.find((s) => String(s.studentId) === String(formData.studentId));
      const jobObj = jobs.find((j) => String(j.jobId) === String(formData.jobId));

      const payload = {
        applicationId: Number(formData.applicationId),
        student: {
          studentId: Number(formData.studentId),
          name: studentObj?.name || '',
        },
        job: {
          jobId: Number(formData.jobId),
          jobTitle: jobObj?.jobTitle || '',
        },
        applicationDate: formData.applicationDate,
        status: formData.status,
      };

      await applicationsApi.create(payload);
      toast.success(`Application #${payload.applicationId} registered successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        applicationId: '',
        studentId: '',
        jobId: '',
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'APPLIED',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create application:', err);
      toast.error(err.message || 'Failed to record application. Note: Unique (studentId, jobId) constraint.');
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
            Student Applications
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Candidate submissions, current review pipeline states, and scheduled hiring workflows.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
          id="btn-create-application"
        >
          New Application
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
            placeholder="Search candidate, job, ID..."
            id="app-search-input"
          />

          <div style={{ minWidth: 180 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by application status"
            >
              <option value="">All Statuses</option>
              {APPLICATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Applications: <strong>{filteredApps.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredApps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Applications Found"
          description={
            searchQuery || statusFilter
              ? 'No applications match your filter query.'
              : 'There are currently no recorded student applications.'
          }
          actionText="New Application"
          actionIcon={Plus}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Candidate</th>
                  <th>Applied Role</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map((app) => (
                  <tr key={app.applicationId}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{app.applicationId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {app.student?.name || `Student #${app.student?.studentId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        ID: {app.student?.studentId} • CGPA: {app.student?.cgpa ?? '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {app.job?.jobTitle || `Job #${app.job?.jobId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Type: {app.job?.jobType || 'Full Time'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {app.job?.company?.companyName || '—'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                      {formatDate(app.applicationDate)}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleView(app)}
                          aria-label={`View details of application #${app.applicationId}`}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setAppToDelete(app)}
                          aria-label={`Delete application #${app.applicationId}`}
                          title="Delete Application"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApps.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Application #${selectedApp?.applicationId} Details`}
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Current Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedApp.status} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Submission Date
                </span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                  {formatDate(selectedApp.applicationDate)}
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Applicant
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {selectedApp.student?.name} (ID: #{selectedApp.student?.studentId})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Email: {selectedApp.student?.email} • CGPA: {selectedApp.student?.cgpa}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Applied Job Opening
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  {selectedApp.job?.jobTitle} (Job ID: #{selectedApp.job?.jobId})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Company: {selectedApp.job?.company?.companyName} • Compensation: {formatSalary(selectedApp.job?.packageAmount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record New Application"
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
              onClick={handleCreate}
              isLoading={isSubmitting}
              id="submit-record-app-btn"
            >
              Record Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput
              label="Application ID"
              name="applicationId"
              type="number"
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
              placeholder="e.g. 321"
              required
              error={formErrors.applicationId}
              helpText="Unique numeric application ID"
            />

            <FormSelect
              label="Student"
              name="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              options={students.map((s) => ({
                value: s.studentId,
                label: `${s.name} (ID: ${s.studentId}, CGPA: ${s.cgpa})`,
              }))}
              required
              error={formErrors.studentId}
            />

            <FormSelect
              label="Target Job"
              name="jobId"
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
              options={jobs.map((j) => ({
                value: j.jobId,
                label: `${j.jobTitle} - ${j.company?.companyName || ''} (ID: ${j.jobId})`,
              }))}
              required
              error={formErrors.jobId}
            />

            <FormInput
              label="Application Date"
              name="applicationDate"
              type="date"
              value={formData.applicationDate}
              onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
              required
              error={formErrors.applicationDate}
            />

            <FormSelect
              label="Pipeline Status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={APPLICATION_STATUSES.map((st) => ({
                value: st,
                label: st,
              }))}
              required
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message={`Are you sure you want to remove application #${appToDelete?.applicationId} for candidate "${appToDelete?.student?.name}"?`}
        confirmText="Delete Application"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ApplicationsPage;
