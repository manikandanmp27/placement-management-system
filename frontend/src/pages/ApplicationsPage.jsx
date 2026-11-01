import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  User,
  Building2,
} from 'lucide-react';

import { applicationsApi } from '../api/applications';
import { studentsApi } from '../api/students';
import { jobsApi } from '../api/jobs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { Card } from '../components/common/Card';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { formatDate, formatSalary } from '../utils/formatters';

const APPLICATION_STATUSES = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'];
const TODAY_DATE = new Date().toISOString().split('T')[0];

export function ApplicationsPage() {
  const { toast } = useToast();
  const { isStudent } = useAuth();

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

  // Status progression modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusApp, setStatusApp] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState('APPLIED');
  const [statusModalError, setStatusModalError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [formData, setFormData] = useState({
    applicationId: '',
    studentId: '',
    jobId: '',
    applicationDate: TODAY_DATE,
    status: 'APPLIED',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts for the summary strip
  const statusCounts = useMemo(() => {
    const counts = { ALL: applications.length, APPLIED: 0, SHORTLISTED: 0, SELECTED: 0, REJECTED: 0 };
    applications.forEach((a) => {
      const st = a.status?.toUpperCase();
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [applications]);

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
      toast.success(`Application #${appToDelete.applicationId} was deleted.`);
      setAppToDelete(null);
      await loadData();
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
      toast.success(`Application #${payload.applicationId} recorded successfully.`);
      setIsCreateModalOpen(false);
      setFormData({
        applicationId: '',
        studentId: '',
        jobId: '',
        applicationDate: TODAY_DATE,
        status: 'APPLIED',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create application:', err);
      toast.error(err.message || 'Failed to record application. Note: (studentId, jobId) must be unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusModal = (app) => {
    setStatusApp(app);
    setNewStatusValue(app.status || 'APPLIED');
    setStatusModalError(null);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async (e) => {
    if (e) e.preventDefault();
    if (!statusApp) return;

    try {
      setIsUpdatingStatus(true);
      setStatusModalError(null);
      await applicationsApi.updateStatus(statusApp.applicationId, newStatusValue);
      toast.success(`Application #${statusApp.applicationId} status updated to ${newStatusValue}`);
      setIsStatusModalOpen(false);
      if (selectedApp && selectedApp.applicationId === statusApp.applicationId) {
        setSelectedApp({ ...selectedApp, status: newStatusValue });
      }
      await loadData();
    } catch (err) {
      console.error('Failed to update application status:', err);
      const backendError = err.message || 'Failed to update application status.';
      setStatusModalError(backendError);
      toast.error(backendError);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">
            Lifecycle management of candidate submissions, interview shortlists, and placement outcomes.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh application records"
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
              id="btn-create-application"
            >
              <Plus size={16} />
              <span>New Application</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Summary Strip (Clickable segmented filter) */}
      <div
        className="segmented-control"
        style={{ marginBottom: 'var(--space-6)', overflowX: 'auto', maxWidth: '100%' }}
        role="group"
        aria-label="Filter applications by status"
      >
        <button
          type="button"
          className={`segment-btn ${!statusFilter ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          All Applications ({statusCounts.ALL})
        </button>
        <button
          type="button"
          className={`segment-btn ${statusFilter === 'APPLIED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('APPLIED')}
        >
          Applied ({statusCounts.APPLIED})
        </button>
        <button
          type="button"
          className={`segment-btn ${statusFilter === 'SHORTLISTED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('SHORTLISTED')}
        >
          Shortlisted ({statusCounts.SHORTLISTED})
        </button>
        <button
          type="button"
          className={`segment-btn ${statusFilter === 'SELECTED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('SELECTED')}
        >
          Selected ({statusCounts.SELECTED})
        </button>
        <button
          type="button"
          className={`segment-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected ({statusCounts.REJECTED})
        </button>
      </div>

      {/* Main Content Card */}
      <Card>
        {/* FilterBar */}
        <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search candidate, job, ID..."
            className="filter-search"
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

          {(searchQuery || statusFilter) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredApps.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{applications.length}</strong> applications
          </div>
        </div>

        {/* State Management */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <ErrorState
            title="Couldn't load applications"
            message={error}
            onRetry={loadData}
          />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter ? 'No matching applications' : 'No applications recorded'}
            message={
              searchQuery || statusFilter
                ? 'No application records match your filter criteria.'
                : 'There are currently no recorded student applications.'
            }
            action={
              searchQuery || statusFilter ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
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
                  <span>New Application</span>
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
                    <th style={{ minWidth: '220px' }}>Candidate</th>
                    <th style={{ minWidth: '220px' }}>Job & Company</th>
                    <th className="col-date" style={{ width: '130px' }}>Applied Date</th>
                    <th className="col-status" style={{ width: '130px', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '90px' }}>App ID</th>
                    <th className="col-actions" style={{ textAlign: 'right', width: isStudent ? '80px' : '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApps.map((app) => (
                    <tr key={app.applicationId}>
                      {/* 1. Candidate */}
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {app.student?.name || `Student #${app.student?.studentId}`}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: #{app.student?.studentId} • CGPA: {app.student?.cgpa ?? '—'}
                        </div>
                      </td>

                      {/* 2. Job & Company */}
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {app.job?.jobTitle || `Job #${app.job?.jobId}`}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                          <Building2 size={12} />
                          <span>{app.job?.company?.companyName || '—'}</span>
                        </div>
                      </td>

                      {/* 3. Applied Date */}
                      <td className="col-date" style={{ width: '130px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDate(app.applicationDate)}
                      </td>

                      {/* 4. Status */}
                      <td className="col-status" style={{ width: '130px', textAlign: 'center' }}>
                        <StatusBadge status={app.status} />
                      </td>

                      {/* 5. App ID */}
                      <td style={{ width: '90px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        #{app.applicationId}
                      </td>

                      {/* 6. Actions */}
                      <td className="col-actions" style={{ width: isStudent ? '80px' : '150px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleView(app)}
                            aria-label={`View details of application #${app.applicationId}`}
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>

                          {!isStudent && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleOpenStatusModal(app)}
                                aria-label={`Update status for application #${app.applicationId}`}
                                title="Update status"
                                id={`btn-status-app-${app.applicationId}`}
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => setAppToDelete(app)}
                                aria-label={`Delete application #${app.applicationId}`}
                                title="Delete application"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Cards View (<768px) */}
            <div className="data-card-list">
              {paginatedApps.map((app) => (
                <div key={app.applicationId} className="data-card">
                  <div className="data-card-header">
                    <div>
                      <div className="data-card-title">{app.student?.name}</div>
                      <div className="data-card-subtitle">{app.job?.jobTitle} • {app.job?.company?.companyName}</div>
                    </div>
                    <div className="data-card-badge">
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <div className="data-card-grid">
                    <div className="data-card-field">
                      <div className="data-card-field-label">Student ID</div>
                      <div className="data-card-field-value" style={{ fontFamily: 'var(--font-mono)' }}>
                        #{app.student?.studentId}
                      </div>
                    </div>
                    <div className="data-card-field">
                      <div className="data-card-field-label">App ID</div>
                      <div className="data-card-field-value" style={{ fontFamily: 'var(--font-mono)' }}>
                        #{app.applicationId}
                      </div>
                    </div>
                    <div className="data-card-field">
                      <div className="data-card-field-label">Applied Date</div>
                      <div className="data-card-field-value">
                        {formatDate(app.applicationDate)}
                      </div>
                    </div>
                    <div className="data-card-field">
                      <div className="data-card-field-label">CGPA</div>
                      <div className="data-card-field-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {app.student?.cgpa ?? '—'}
                      </div>
                    </div>
                  </div>

                  <div className="data-card-footer">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleView(app)}
                      style={{ flex: 1 }}
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    {!isStudent && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenStatusModal(app)}
                        style={{ flex: 1 }}
                      >
                        <Pencil size={14} />
                        <span>Update Status</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredApps.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      {/* View Application Details Modal */}
      {isViewModalOpen && selectedApp && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Application #${selectedApp.applicationId}`}
          size="md"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              {!isStudent && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenStatusModal(selectedApp);
                  }}
                >
                  <Pencil size={14} />
                  <span>Update Status</span>
                </button>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedApp.status} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Submission Date
                </span>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  {formatDate(selectedApp.applicationDate)}
                </div>
              </div>
            </div>

            {/* Definition Grid */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Candidate
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {selectedApp.student?.name} (ID: #{selectedApp.student?.studentId})
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Email: {selectedApp.student?.email} • CGPA: {selectedApp.student?.cgpa ?? '—'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Applied Job Opening
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {selectedApp.job?.jobTitle} (Job ID: #{selectedApp.job?.jobId})
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Company: {selectedApp.job?.company?.companyName} • Package: {formatSalary(selectedApp.job?.packageAmount)}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Application Status Modal with Linear Stepper */}
      {isStatusModalOpen && statusApp && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => !isUpdatingStatus && setIsStatusModalOpen(false)}
          title={`Update Status — Application #${statusApp.applicationId}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                id="submit-update-app-status-btn"
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Updating…</span>
                  </>
                ) : (
                  <span>Move to {newStatusValue}</span>
                )}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {statusModalError && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={16} />
                <span>{statusModalError}</span>
              </div>
            )}

            {/* Stepper Visualization */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              {APPLICATION_STATUSES.map((st, idx) => {
                const isCurrent = statusApp.status === st;
                const isSelected = newStatusValue === st;

                return (
                  <React.Fragment key={st}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isSelected
                            ? 'var(--color-primary-600)'
                            : isCurrent
                            ? 'var(--color-primary-100)'
                            : 'var(--color-surface)',
                          color: isSelected
                            ? 'var(--color-text-inverse)'
                            : isCurrent
                            ? 'var(--color-primary-600)'
                            : 'var(--color-text-muted)',
                          border: isSelected
                            ? '2px solid var(--color-primary-600)'
                            : '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--color-primary-600)' : 'var(--color-text-muted)' }}>
                        {st}
                      </span>
                    </div>
                    {idx < APPLICATION_STATUSES.length - 1 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--color-border)', margin: '0 4px', marginBottom: '14px' }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Summary details */}
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <div><strong>Candidate:</strong> {statusApp.student?.name} (ID: #{statusApp.student?.studentId})</div>
              <div><strong>Target Role:</strong> {statusApp.job?.jobTitle} • {statusApp.job?.company?.companyName}</div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="form-label" htmlFor="select-new-status">
                Transition to Status
              </label>
              <select
                id="select-new-status"
                className="form-select"
                value={newStatusValue}
                onChange={(e) => {
                  setNewStatusValue(e.target.value);
                  setStatusModalError(null);
                }}
              >
                {APPLICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {newStatusValue === 'SELECTED' && (
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span>
                  <strong>Placement Integrity Guard:</strong> Marking candidate as SELECTED authorizes their placement offer. Ensure interview round evaluations are finalized.
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Record New Application Modal */}
      {isCreateModalOpen && !isStudent && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Record New Application"
          size="md"
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
                onClick={handleCreate}
                disabled={isSubmitting}
                id="submit-record-app-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Recording…</span>
                  </>
                ) : (
                  <span>Record Application</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormInput
                label="Application ID"
                name="applicationId"
                type="number"
                value={formData.applicationId}
                onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                placeholder="e.g. 321"
                required
                error={formErrors.applicationId}
                helperText="Unique numeric application ID"
                min={1}
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
      )}

      {/* Confirm Delete Dialog */}
      {appToDelete && !isStudent && (
        <ConfirmDialog
          isOpen={!!appToDelete}
          onClose={() => !isDeleting && setAppToDelete(null)}
          onConfirm={handleDelete}
          title="Delete this application?"
          type="danger"
          confirmLabel="Delete Application"
          confirmLoading={isDeleting}
          message={`Are you sure you want to remove application #${appToDelete.applicationId} for candidate "${appToDelete.student?.name}"? Associated interview rounds will be affected.`}
        />
      )}
    </div>
  );
}

export default ApplicationsPage;

