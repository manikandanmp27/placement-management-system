import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Briefcase,
  Building2,
  Eye,
  MapPin,
  Globe,
} from 'lucide-react';

import { applicationsApi } from '../api/applications';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'APPLIED', label: 'Applied (Under Review)' },
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

  // Summary counts
  const counts = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter((a) => a.status === 'APPLIED').length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      selected: applications.filter((a) => a.status === 'SELECTED').length,
      rejected: applications.filter((a) => a.status === 'REJECTED').length,
    };
  }, [applications]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '70px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonTable rows={5} columns={5} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Bar with Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>My Applications</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Track all your submitted campus recruitment applications and screening stages.
          </p>
        </div>

        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <Button variant="primary">
            <Briefcase size={16} />
            Browse Open Jobs
          </Button>
        </Link>
      </div>

      {/* 2. Stats Breakdown Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Applied</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem' }}>{counts.total}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-info, #3B82F6)', textTransform: 'uppercase', fontWeight: 600 }}>Under Review</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-info, #3B82F6)' }}>{counts.applied}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-warning, #F59E0B)', textTransform: 'uppercase', fontWeight: 600 }}>Shortlisted</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-warning, #F59E0B)' }}>{counts.shortlisted}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success, #10B981)', textTransform: 'uppercase', fontWeight: 600 }}>Selected</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-success, #10B981)' }}>{counts.selected}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-danger, #EF4444)', textTransform: 'uppercase', fontWeight: 600 }}>Not Selected</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-danger, #EF4444)' }}>{counts.rejected}</div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <Card>
        <CardBody style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by job title or company name..."
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.875rem' }}
                aria-label="Filter by application status"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. Applications List / Table */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={applications.length === 0 ? 'No Applications Submitted Yet' : 'No Matching Applications Found'}
          description={
            applications.length === 0
              ? 'You have not submitted any applications yet. Review active job openings and verify your eligibility to apply.'
              : 'Try adjusting your search criteria or status filter to see other applications.'
          }
          action={
            applications.length === 0 ? (
              <Link to="/jobs">
                <Button variant="primary">Explore Job Openings</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Opening</th>
                  <th>Company</th>
                  <th>Package</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.applicationId}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {app.job?.jobTitle || 'Job Opening'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {app.job?.jobType || 'Full Time'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{app.job?.company?.companyName || 'Corporate Partner'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {app.job?.company?.location || '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatSalary(app.job?.package)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {formatDate(app.applicationDate)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => setSelectedApp(app)}
                        title="View Application Details"
                        aria-label="View Application Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. View Details Modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        footer={
          <Button variant="secondary" onClick={() => setSelectedApp(null)}>
            Close
          </Button>
        }
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Status Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Application ID #{selectedApp.applicationId}
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
                  Submitted on {formatDate(selectedApp.applicationDate)}
                </div>
              </div>
              <StatusBadge status={selectedApp.status} />
            </div>

            {/* Position Details */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Position Information
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Role Title</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedApp.job?.jobTitle}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Engagement Type</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedApp.job?.jobType || 'Full Time'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Offered Package</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                    {formatSalary(selectedApp.job?.package)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Application Deadline</div>
                  <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                    {formatDate(selectedApp.job?.deadline)}
                  </div>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                Company Information
              </h4>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedApp.job?.company?.companyName}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {selectedApp.job?.company?.industry && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={14} />
                      <span>{selectedApp.job?.company?.industry}</span>
                    </div>
                  )}
                  {selectedApp.job?.company?.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} />
                      <span>{selectedApp.job?.company?.location}</span>
                    </div>
                  )}
                  {selectedApp.job?.company?.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Globe size={14} />
                      <a
                        href={selectedApp.job?.company?.website.startsWith('http') ? selectedApp.job?.company?.website : `https://${selectedApp.job?.company?.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                      >
                        Visit Portal
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            {selectedApp.job?.jobDescription && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                  Job Description & Criteria
                </h4>
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {selectedApp.job.jobDescription}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StudentApplicationsPage;
