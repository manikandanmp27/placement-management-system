import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  MapPin,
  Briefcase,
  Globe,
} from 'lucide-react';

import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import FormInput from '../components/forms/FormInput';
import { formatSalary } from '../utils/formatters';

export function CompaniesPage() {
  const toast = useToast();

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

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const distinctIndustries = useMemo(() => {
    const set = new Set();
    companies.forEach((c) => {
      if (c.industry) set.add(c.industry.trim());
    });
    return Array.from(set);
  }, [companies]);

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

  const companyJobs = useMemo(() => {
    if (!selectedCompany) return [];
    return jobs.filter(
      (j) => j.company?.companyId === selectedCompany.companyId
    );
  }, [jobs, selectedCompany]);

  const handleView = (company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      setIsDeleting(true);
      await companiesApi.delete(companyToDelete.companyId);
      toast.success(`Company ${companyToDelete.companyName} deleted successfully.`);
      setCompanyToDelete(null);
      loadData();
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
      errors.companyId = 'Valid positive company ID is required';
    }
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
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
      toast.success(`Company "${payload.companyName}" added successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        companyId: '',
        companyName: '',
        industry: '',
        location: '',
        website: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to register company:', err);
      toast.error(err.message || 'Failed to create company. Ensure company ID and name are unique.');
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
            Corporate Partners
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Registered hiring organizations, industry categories, and recruitment locations.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
          id="btn-register-company"
        >
          Add Company
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
            placeholder="Search company, location, industry..."
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
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Companies: <strong>{filteredCompanies.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Companies Found"
          description={
            searchQuery || industryFilter
              ? 'No company matched your search. Try resetting your query.'
              : 'There are currently no corporate partners recorded in the database.'
          }
          actionText="Add Company"
          actionIcon={Plus}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Location</th>
                  <th>Website</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((comp) => (
                  <tr key={comp.companyId}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{comp.companyId}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-primary-subtle)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {comp.companyName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {comp.companyName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {comp.industry || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)' }}>
                        <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{comp.location || '—'}</span>
                      </div>
                    </td>
                    <td>
                      {comp.website ? (
                        <a
                          href={comp.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                        >
                          <span>Visit</span>
                          <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleView(comp)}
                          aria-label={`View details of ${comp.companyName}`}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setCompanyToDelete(comp)}
                          aria-label={`Delete ${comp.companyName}`}
                          title="Delete Company"
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
        </div>
      )}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Company Profile"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedCompany && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                }}
              >
                {selectedCompany.companyName.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedCompany.companyName}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Partner ID: #{selectedCompany.companyId}
                </span>
                {selectedCompany.website && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {selectedCompany.website} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                backgroundColor: 'var(--color-surface-hover)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Industry
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                  {selectedCompany.industry || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Corporate Headquarters / Location
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>
                  {selectedCompany.location || 'Not specified'}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                Active Job Openings ({companyJobs.length})
              </h4>
              {companyJobs.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  No job postings currently active for this partner.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {companyJobs.map((j) => (
                    <div
                      key={j.jobId}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{j.jobTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Type: {j.jobType || 'Full Time'} • Min CGPA: {j.minCgpa}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9rem' }}>
                        {formatSalary(j.packageAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Corporate Partner"
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
              id="submit-register-company-btn"
            >
              Save Company
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput
              label="Company ID"
              name="companyId"
              type="number"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              placeholder="e.g. 6"
              required
              error={formErrors.companyId}
              helpText="Unique numeric company ID"
            />

            <FormInput
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Microsoft"
              required
              error={formErrors.companyName}
            />

            <FormInput
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g. Information Technology"
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
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Company Partner"
        message={`Are you sure you want to delete "${companyToDelete?.companyName}" (ID #${companyToDelete?.companyId})? Any referenced records may prevent this operation.`}
        confirmText="Delete Partner"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default CompaniesPage;
