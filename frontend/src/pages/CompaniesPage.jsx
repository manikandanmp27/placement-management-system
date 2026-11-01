import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { Card } from '../components/common/Card';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import { CategoryTag } from '../components/common/StatusBadge';
import { FormInput } from '../components/forms/FormInput';
import { formatSalary } from '../utils/formatters';

export function CompaniesPage() {
  const { role } = useAuth();
  const isStudent = role === 'ROLE_STUDENT';
  const { toast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    companyName: '',
    industry: '',
    location: '',
    website: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [companiesData, jobsData] = await Promise.all([
        companiesApi.getAll(),
        jobsApi.getAll().catch(() => []),
      ]);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError(err.message || 'Failed to load company records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const distinctIndustries = useMemo(() => {
    const set = new Set();
    companies.forEach((c) => {
      if (c.industry) set.add(c.industry.trim());
    });
    return Array.from(set).sort();
  }, [companies]);

  // Count active drives per company
  const companyJobsMap = useMemo(() => {
    const map = {};
    jobs.forEach((j) => {
      const cId = j.company?.companyId;
      if (cId) {
        if (!map[cId]) map[cId] = [];
        map[cId].push(j);
      }
    });
    return map;
  }, [jobs]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.companyName?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        String(c.companyId).includes(q);

      const matchesIndustry = !industryFilter || c.industry === industryFilter;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchQuery, industryFilter]);

  const selectedCompanyJobs = useMemo(() => {
    if (!selectedCompany) return [];
    return companyJobsMap[selectedCompany.companyId] || [];
  }, [selectedCompany, companyJobsMap]);

  const handleView = (company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      setIsDeleting(true);
      await companiesApi.delete(companyToDelete.companyId);
      toast.success(`Company "${companyToDelete.companyName}" deleted successfully.`);
      setCompanyToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete company:', err);
      toast.error(err.message || 'Cannot delete company with associated jobs or placements.');
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.companyId || isNaN(formData.companyId) || Number(formData.companyId) <= 0) {
      errors.companyId = 'A positive integer is required for company ID.';
    }
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required.';
    }
    if (formData.website && !formData.website.startsWith('http')) {
      errors.website = 'Website must start with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        companyId: Number(formData.companyId),
        companyName: formData.companyName.trim(),
        industry: formData.industry.trim() || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
      };

      await companiesApi.create(payload);
      toast.success(`Company "${payload.companyName}" registered successfully.`);
      setIsCreateModalOpen(false);
      setFormData({
        companyId: '',
        companyName: '',
        industry: '',
        location: '',
        website: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to register company:', err);
      toast.error(err.message || 'Failed to create company. Ensure company ID and name are unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeJobsForCompanyToDelete = companyToDelete
    ? (companyJobsMap[companyToDelete.companyId] || []).length
    : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">
            Hiring organizations, industry sectors, and active recruitment drives.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh corporate partners"
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
              id="btn-register-company"
            >
              <Plus size={16} />
              <span>Add Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        {/* FilterBar */}
        <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by company, location, industry..."
            className="filter-search"
            id="company-search-input"
          />

          {distinctIndustries.length > 0 && (
            <div style={{ minWidth: 200 }}>
              <select
                className="form-select"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                aria-label="Filter by industry"
              >
                <option value="">All Industries</option>
                {distinctIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || industryFilter) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setIndustryFilter('');
              }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredCompanies.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{companies.length}</strong> companies
          </div>
        </div>

        {/* State Management */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : error ? (
          <ErrorState
            title="Couldn't load companies"
            message={error}
            onRetry={loadData}
          />
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            title={searchQuery || industryFilter ? 'No matching companies' : 'No companies listed yet'}
            message={
              searchQuery || industryFilter
                ? 'No companies match your active filters. Try clearing your search.'
                : isStudent
                ? 'No recruitment partners have been registered by the placement cell yet.'
                : 'There are currently no corporate partners recorded. Register the first company above.'
            }
            action={
              searchQuery || industryFilter ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setIndustryFilter('');
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
                  <span>Add Company</span>
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ minWidth: '220px' }}>Company</th>
                  <th style={{ width: '140px' }}>Industry</th>
                  <th style={{ width: '150px' }}>Location</th>
                  <th style={{ width: '110px' }}>Website</th>
                  <th className="col-numeric" style={{ width: '130px', textAlign: 'right' }}>Open Drives</th>
                  <th className="col-actions" style={{ width: isStudent ? '100px' : '170px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((comp) => {
                  const jobCount = (companyJobsMap[comp.companyId] || []).length;
                  return (
                    <tr key={comp.companyId}>
                      <td style={{ width: '80px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        #{comp.companyId}
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-primary-50)',
                              color: 'var(--color-primary-600)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: 'var(--text-xs)',
                              flexShrink: 0,
                            }}
                          >
                            {comp.companyName.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
                            {comp.companyName}
                          </span>
                        </div>
                      </td>
                      <td style={{ width: '140px' }}>
                        <CategoryTag label={comp.industry || 'General'} />
                      </td>
                      <td style={{ width: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <MapPin size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.location || '—'}</span>
                        </div>
                      </td>
                      <td style={{ width: '110px' }}>
                        {comp.website ? (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-link"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)' }}
                            aria-label={`Visit ${comp.companyName} website (opens in new tab)`}
                          >
                            <span>Visit</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="col-numeric" style={{ width: '130px', textAlign: 'right' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: jobCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                          {jobCount}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-1)' }}>
                          {jobCount === 1 ? 'drive' : 'drives'}
                        </span>
                      </td>
                      <td className="col-actions" style={{ width: isStudent ? '100px' : '170px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleView(comp)}
                            aria-label={`View details of ${comp.companyName}`}
                            title="View details"
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>
                          {!isStudent && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-danger"
                              onClick={() => setCompanyToDelete(comp)}
                              aria-label={`Delete ${comp.companyName}`}
                              title={jobCount > 0 ? 'Active drives associated' : 'Delete company'}
                            >
                              <Trash2 size={15} />
                              <span>Delete</span>
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
        )}
      </Card>

      {/* View Details Modal (lg) */}
      {isViewModalOpen && selectedCompany && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Company Profile"
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-primary-50)',
                  color: 'var(--color-primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 'var(--text-lg)',
                  flexShrink: 0,
                }}
              >
                {selectedCompany.companyName.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                  {selectedCompany.companyName}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Partner ID: #{selectedCompany.companyId}
                </span>
                {selectedCompany.website && (
                  <div style={{ marginTop: 'var(--space-1)' }}>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link"
                      style={{ fontSize: 'var(--text-xs)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
                    >
                      <span>{selectedCompany.website}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Definition Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Industry
                </div>
                <div style={{ marginTop: 'var(--space-1)' }}>
                  <CategoryTag label={selectedCompany.industry || 'Not specified'} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Headquarters / Location
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: 'var(--space-1)', color: 'var(--color-text-primary)' }}>
                  {selectedCompany.location || 'Not specified'}
                </div>
              </div>
            </div>

            {/* Open Job Drives */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 0 }}>
                  Open Job Drives ({selectedCompanyJobs.length})
                </h4>
                {selectedCompanyJobs.length > 0 && (
                  <Link to="/jobs" className="btn-link" style={{ fontSize: 'var(--text-xs)' }}>
                    View in Jobs module &rarr;
                  </Link>
                )}
              </div>

              {selectedCompanyJobs.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                  No recruitment drives currently posted for this partner.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {selectedCompanyJobs.map((j) => (
                    <div
                      key={j.jobId}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {j.jobTitle}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <CategoryTag label={j.jobType || 'Full Time'} />
                          <span>Min CGPA: <strong>{j.minCgpa}</strong></span>
                          <span>Max Backlogs: <strong>{j.maxBacklogs ?? 0}</strong></span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatSalary(j.packageAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && !isStudent && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Add Corporate Partner"
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
                id="submit-register-company-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Company</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormInput
                label="Company ID"
                name="companyId"
                type="number"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                placeholder="e.g. 10"
                required
                error={formErrors.companyId}
                helperText="Unique numeric company ID identifier"
                min={1}
              />

              <FormInput
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Microsoft Corporation"
                required
                error={formErrors.companyName}
              />

              <FormInput
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Information Technology, FinTech, Automotive"
                helperText="Primary industry sector"
              />

              <FormInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bengaluru, India"
              />

              <FormInput
                label="Website URL"
                name="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.example.com"
                error={formErrors.website}
                helperText="Include http:// or https://"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {companyToDelete && !isStudent && (
        <ConfirmDialog
          isOpen={!!companyToDelete}
          onClose={() => !isDeleting && setCompanyToDelete(null)}
          onConfirm={handleDelete}
          title="Delete this corporate partner?"
          type="danger"
          confirmLabel="Delete Company"
          confirmLoading={isDeleting}
          message={
            <div>
              {activeJobsForCompanyToDelete > 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 'var(--space-3)' }}>
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Partner has {activeJobsForCompanyToDelete} recruitment drive(s).</strong>
                    <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)' }}>
                      Deleting this company will fail if active job applications or placement records reference it.
                    </p>
                  </div>
                </div>
              )}
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                Are you sure you want to delete corporate partner <strong>"{companyToDelete.companyName}"</strong> (ID #{companyToDelete.companyId})?
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}

export default CompaniesPage;

