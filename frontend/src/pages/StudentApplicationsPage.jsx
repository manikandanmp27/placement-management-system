import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Briefcase,
  Building2,
  Eye,
  Calendar,
  Check,
  ExternalLink,
  MapPin,
  Clock,
} from 'lucide-react';

import { applicationsApi } from '../api/applications';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import { Card, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'APPLIED', label: 'Under Review' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function StudentApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationsApi.getAll();
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load my applications:', err);
      setError(err.message || 'Unable to retrieve your applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const jobTitle = app.job?.jobTitle?.toLowerCase() || '';
      const companyName = app.job?.company?.companyName?.toLowerCase() || '';
      const matchesSearch = !q || jobTitle.includes(q) || companyName.includes(q);
      const matchesStatus = !statusFilter || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  // Funnel counts
  const counts = useMemo(() => {
    return {
      all: applications.length,
      APPLIED: applications.filter((a) => a.status === 'APPLIED').length,
      SHORTLISTED: applications.filter((a) => a.status === 'SHORTLISTED').length,
      SELECTED: applications.filter((a) => a.status === 'SELECTED').length,
      REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    };
  }, [applications]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could Not Load Applications"
        message={error}
        onRetry={loadApplications}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">My Applications</h1>
          <p className="page-header-subtitle">
            Track your submitted applications, shortlists, and decision outcomes
          </p>
        </div>

        <div className="page-header-actions">
          <Link to="/jobs" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">
              <Briefcase size={15} strokeWidth={1.75} />
              <span>Browse Open Jobs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Funnel Summary Strip (Clickable quick filter segments) */}
      <div
        className="segmented-control"
        style={{
          width: '100%',
          justifyContent: 'space-between',
          overflowX: 'auto',
          padding: '4px',
        }}
        role="tablist"
        aria-label="Filter applications by status"
      >
        {STATUS_FILTERS.map((tab) => {
          const count = tab.value === '' ? counts.all : counts[tab.value] || 0;
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`segmented-btn ${isActive ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.value)}
              role="tab"
              aria-selected={isActive}
              style={{ flex: 1, justifyContent: 'center', height: '36px' }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--color-primary-100)' : 'var(--color-surface-hover)',
                  color: isActive ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar-search">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by job title or company..."
          />
        </div>

        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        )}
      </div>

      {/* 3. Table (Desktop) & Card List (Mobile) */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={statusFilter || searchQuery ? 'No matching applications' : 'You haven’t applied to any jobs yet'}
          description={
            statusFilter || searchQuery
              ? 'No application records match your current filter settings. Try clearing search criteria.'
              : 'Browse active recruitment drives and submit your candidate profile to begin the selection process.'
          }
          actionText={statusFilter || searchQuery ? 'Clear filters' : 'Browse Open Jobs'}
          onAction={() => {
            if (statusFilter || searchQuery) {
              setSearchQuery('');
              setStatusFilter('');
            }
          }}
        />
      ) : (
        <div className="table-responsive-wrapper has-card-view">
          {/* Desktop Table View */}
          <div className="table-container">
            <table className="table" aria-label="My Applications Table">
              <thead>
                <tr>
                  <th className="sticky-col-first">Job Title & Company</th>
                  <th>Job Type</th>
                  <th className="col-numeric">Compensation</th>
                  <th>Date Applied</th>
                  <th>Selection Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.applicationId}>
                    <td className="sticky-col-first">
                      <div className="cell-primary">
                        <span className="cell-title">{app.job?.jobTitle || `Job #${app.jobId}`}</span>
                        <span className="cell-subtitle">{app.job?.company?.companyName || 'Corporate Partner'}</span>
                      </div>
                    </td>
                    <td>
                      <CategoryTag>{app.job?.jobType || 'Full Time'}</CategoryTag>
                    </td>
                    <td className="col-numeric">
                      <span style={{ fontWeight: 600 }}>
                        {formatSalary(app.job?.packageAmount || app.job?.package)}
                      </span>
                    </td>
                    <td>{formatDate(app.applicationDate)}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedApp(app)}
                        aria-label={`View application details for ${app.job?.jobTitle}`}
                      >
                        <Eye size={14} strokeWidth={1.75} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (<768px) */}
          <div className="data-cards-list">
            {filteredApplications.map((app) => (
              <div key={app.applicationId} className="data-card">
                <div className="data-card-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>
                      {app.job?.jobTitle || `Job #${app.jobId}`}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      {app.job?.company?.companyName}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="data-card-grid">
                  <div className="data-card-field">
                    <span className="data-card-label">Package</span>
                    <span className="data-card-value">{formatSalary(app.job?.packageAmount || app.job?.package)}</span>
                  </div>
                  <div className="data-card-field">
                    <span className="data-card-label">Applied On</span>
                    <span className="data-card-value">{formatDate(app.applicationDate)}</span>
                  </div>
                </div>

                <div className="data-card-footer">
                  <CategoryTag>{app.job?.jobType || 'Full Time'}</CategoryTag>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedApp(app)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Application View Modal (with Stepper per Blueprint 8.4) */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={selectedApp.job?.jobTitle || 'Application Details'}
          subtitle={selectedApp.job?.company?.companyName || 'Corporate Partner'}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedApp(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Header Status & Top Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>
                  Application Reference ID
                </span>
                <span className="record-id" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  APP-#{selectedApp.applicationId}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Current Status
                </span>
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>

            {/* Stepper (Applied -> Shortlisted -> Decision) */}
            <div style={{ padding: '0 var(--space-4)' }}>
              <div className="stepper">
                {/* Step 1: Applied */}
                <div className="step-item completed">
                  <div className="step-dot" aria-hidden="true">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                  <span className="step-label">Applied</span>
                </div>

                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor:
                      selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'SELECTED'
                        ? 'var(--color-primary-600)'
                        : 'var(--color-border)',
                    margin: '0 var(--space-2)',
                    marginTop: '-18px',
                  }}
                  aria-hidden="true"
                />

                {/* Step 2: Shortlisted */}
                <div
                  className={`step-item ${
                    selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'SELECTED'
                      ? 'completed'
                      : ''
                  }`}
                >
                  <div className="step-dot" aria-hidden="true">
                    {selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'SELECTED' ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : (
                      '2'
                    )}
                  </div>
                  <span className="step-label">Shortlisted</span>
                </div>

                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor:
                      selectedApp.status === 'SELECTED' || selectedApp.status === 'REJECTED'
                        ? selectedApp.status === 'SELECTED'
                          ? 'var(--color-success)'
                          : 'var(--color-danger)'
                        : 'var(--color-border)',
                    margin: '0 var(--space-2)',
                    marginTop: '-18px',
                  }}
                  aria-hidden="true"
                />

                {/* Step 3: Final Decision */}
                <div
                  className={`step-item ${
                    selectedApp.status === 'SELECTED'
                      ? 'completed'
                      : selectedApp.status === 'REJECTED'
                      ? 'active'
                      : ''
                  }`}
                >
                  <div
                    className="step-dot"
                    style={{
                      borderColor:
                        selectedApp.status === 'SELECTED'
                          ? 'var(--color-success)'
                          : selectedApp.status === 'REJECTED'
                          ? 'var(--color-danger)'
                          : undefined,
                      backgroundColor:
                        selectedApp.status === 'SELECTED'
                          ? 'var(--color-success)'
                          : selectedApp.status === 'REJECTED'
                          ? 'var(--color-danger)'
                          : undefined,
                      color:
                        selectedApp.status === 'SELECTED' || selectedApp.status === 'REJECTED'
                          ? '#FFFFFF'
                          : undefined,
                    }}
                    aria-hidden="true"
                  >
                    {selectedApp.status === 'SELECTED' ? (
                      <Check size={14} strokeWidth={2.5} />
                    ) : selectedApp.status === 'REJECTED' ? (
                      '✕'
                    ) : (
                      '3'
                    )}
                  </div>
                  <span className="step-label">
                    {selectedApp.status === 'SELECTED'
                      ? 'Selected'
                      : selectedApp.status === 'REJECTED'
                      ? 'Rejected'
                      : 'Final Decision'}
                  </span>
                </div>
              </div>
            </div>

            {/* Two-Column Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {/* Compensation & Criteria */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Compensation & Eligibility
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Annual Package</span>
                  <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-600)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatSalary(selectedApp.job?.packageAmount || selectedApp.job?.package)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Minimum CGPA</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                    {selectedApp.job?.minCgpa !== null && selectedApp.job?.minCgpa !== undefined ? `≥ ${selectedApp.job.minCgpa}` : 'Open to all'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Max Backlogs Allowed</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                    {selectedApp.job?.maxBacklogs !== null && selectedApp.job?.maxBacklogs !== undefined ? `≤ ${selectedApp.job.maxBacklogs}` : 'No limit'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Application Deadline</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(selectedApp.job?.deadline)}
                  </span>
                </div>
              </div>

              {/* Corporate Partner Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Hiring Organization
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Company</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {selectedApp.job?.company?.companyName || 'Corporate Partner'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Industry</span>
                  <CategoryTag>{selectedApp.job?.company?.industry || 'Technology'}</CategoryTag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Location</span>
                  <span style={{ fontSize: 'var(--text-sm)' }}>
                    {selectedApp.job?.company?.location || 'Campus / Multiple'}
                  </span>
                </div>
                {selectedApp.job?.company?.website && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Web Portal</span>
                    <a
                      href={selectedApp.job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Visit site</span>
                      <ExternalLink size={12} strokeWidth={1.75} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Formatted Job Description */}
            {selectedApp.job?.jobDescription && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Job Description & Scope
                </h4>
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.6,
                    color: 'var(--color-text-secondary)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedApp.job.jobDescription}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StudentApplicationsPage;
