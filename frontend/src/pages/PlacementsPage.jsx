import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

import { placementsApi } from '../api/placements';
import { studentsApi } from '../api/students';
import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import { formatDate, formatSalary } from '../utils/formatters';

export function PlacementsPage() {
  const toast = useToast();
  const { isStudent } = useAuth();

  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals & Action States
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [placementToDelete, setPlacementToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    placementId: '',
    studentId: '',
    companyId: '',
    jobId: '',
    placementDate: new Date().toISOString().split('T')[0],
    packageAmount: '',
    joiningDate: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [placementsData, studentsData, companiesData, jobsData] =
        await Promise.all([
          placementsApi.getAll(),
          studentsApi.getAll().catch(() => []),
          companiesApi.getAll().catch(() => []),
          jobsApi.getAll().catch(() => []),
        ]);
      setPlacements(Array.isArray(placementsData) ? placementsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error('Failed to load placements:', err);
      setError(err.message || 'Failed to load placement records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Placements
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = p.student?.name?.toLowerCase() || '';
      const companyName = p.company?.companyName?.toLowerCase() || '';
      const jobTitle = p.job?.jobTitle?.toLowerCase() || '';

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        companyName.includes(q) ||
        jobTitle.includes(q) ||
        String(p.placementId).includes(q) ||
        String(p.student?.studentId).includes(q);

      const matchesCompany =
        !companyFilter ||
        String(p.company?.companyId) === String(companyFilter);

      return matchesSearch && matchesCompany;
    });
  }, [placements, searchQuery, companyFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, companyFilter]);

  const totalPages = Math.ceil(filteredPlacements.length / pageSize) || 1;
  const paginatedPlacements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlacements.slice(start, start + pageSize);
  }, [filteredPlacements, currentPage, pageSize]);

  const handleView = (placement) => {
    setSelectedPlacement(placement);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!placementToDelete) return;
    try {
      setIsDeleting(true);
      await placementsApi.delete(placementToDelete.placementId);
      toast.success(`Placement record #${placementToDelete.placementId} removed.`);
      setPlacementToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete placement:', err);
      toast.error(err.message || 'Failed to delete placement record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.placementId || isNaN(formData.placementId) || Number(formData.placementId) <= 0) {
      errors.placementId = 'Valid positive Placement ID is required';
    }
    if (!formData.studentId) {
      errors.studentId = 'Student must be selected';
    }
    if (!formData.companyId) {
      errors.companyId = 'Company must be selected';
    }
    if (!formData.jobId) {
      errors.jobId = 'Job opening must be selected';
    }
    if (!formData.placementDate) {
      errors.placementDate = 'Placement offer date is required';
    }
    if (formData.packageAmount === '' || isNaN(formData.packageAmount) || Number(formData.packageAmount) <= 0) {
      errors.packageAmount = 'Valid package amount is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const studentObj = students.find((s) => String(s.studentId) === String(formData.studentId));
      const companyObj = companies.find((c) => String(c.companyId) === String(formData.companyId));
      const jobObj = jobs.find((j) => String(j.jobId) === String(formData.jobId));

      const payload = {
        placementId: Number(formData.placementId),
        student: {
          studentId: Number(formData.studentId),
          name: studentObj?.name || '',
        },
        company: {
          companyId: Number(formData.companyId),
          companyName: companyObj?.companyName || '',
        },
        job: {
          jobId: Number(formData.jobId),
          jobTitle: jobObj?.jobTitle || '',
        },
        placementDate: formData.placementDate,
        packageAmount: parseFloat(Number(formData.packageAmount).toFixed(2)),
        joiningDate: formData.joiningDate || null,
      };

      await placementsApi.create(payload);
      toast.success(
        `Placement #${payload.placementId} recorded! Database trigger updated ${studentObj?.name || 'student'} to PLACED status.`
      );
      setIsCreateModalOpen(false);
      setFormData({
        placementId: '',
        studentId: '',
        companyId: '',
        jobId: '',
        placementDate: new Date().toISOString().split('T')[0],
        packageAmount: '',
        joiningDate: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create placement:', err);
      toast.error(err.message || 'Failed to record placement. Ensure IDs exist and constraints are satisfied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Placements</h1>
          <p className="page-subtitle">
            Official placement record register, verified recruitment offers, and compensation packages.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh records"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {!isStudent && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
              id="btn-record-placement"
            >
              Record Placement
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card">
        {/* FilterBar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', flex: 1, minWidth: '260px' }}>
            <div style={{ flex: 1, minWidth: '220px', maxWidth: '400px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search candidate, company, role..."
                id="placement-search-input"
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-select"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Filter by recruiting company"
                id="placement-company-filter"
              >
                <option value="">All Companies</option>
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredPlacements.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{placements.length}</strong> placements
          </div>
        </div>

        {/* State Views */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <ErrorState
            title="Unable to load placements"
            message={error}
            onRetry={loadData}
          />
        ) : filteredPlacements.length === 0 ? (
          <EmptyState
            icon={Award}
            title={searchQuery || companyFilter ? 'No matching placements' : 'No placement records'}
            description={
              searchQuery || companyFilter
                ? 'No placement outcomes match the active filters.'
                : 'There are currently no confirmed student placements recorded.'
            }
            actionText={!isStudent && !(searchQuery || companyFilter) ? 'Record Placement' : undefined}
            actionIcon={Plus}
            onAction={!isStudent && !(searchQuery || companyFilter) ? () => setIsCreateModalOpen(true) : undefined}
          />
        ) : (
          <>
            {/* Desktop Table View (>=768px, 6 columns) */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '200px' }}>Student</th>
                    <th style={{ minWidth: '200px' }}>Company & Role</th>
                    <th className="col-numeric" style={{ width: '140px', textAlign: 'right' }}>Package</th>
                    <th className="col-date" style={{ width: '130px' }}>Offer Date</th>
                    <th className="col-date" style={{ width: '130px' }}>Joining Date</th>
                    <th className="col-actions" style={{ textAlign: 'right', width: isStudent ? '80px' : '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlacements.map((p) => (
                    <tr key={p.placementId}>
                      {/* 1. Student */}
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {p.student?.name || `Student #${p.student?.studentId}`}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: #{p.student?.studentId}
                        </div>
                      </td>

                      {/* 2. Company & Role */}
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {p.company?.companyName}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {p.job?.jobTitle}
                        </div>
                      </td>

                      {/* 3. Package (accentuated numeric) */}
                      <td className="col-numeric" style={{ width: '140px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--color-primary-600)', fontSize: 'var(--text-sm)' }}>
                          {formatSalary(p.packageAmount)}
                        </span>
                      </td>

                      {/* 4. Offer Date */}
                      <td className="col-date" style={{ width: '130px', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatDate(p.placementDate)}
                      </td>

                      {/* 5. Joining Date */}
                      <td className="col-date" style={{ width: '130px', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {p.joiningDate ? (
                          formatDate(p.joiningDate)
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>TBD</span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="col-actions" style={{ width: isStudent ? '80px' : '120px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleView(p)}
                            aria-label={`View details of placement #${p.placementId}`}
                            title="View Placement Details"
                            id={`btn-view-placement-${p.placementId}`}
                          >
                            <Eye size={15} />
                          </button>

                          {!isStudent && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-danger"
                              onClick={() => setPlacementToDelete(p)}
                              aria-label={`Delete placement #${p.placementId}`}
                              title="Delete Record"
                              id={`btn-delete-placement-${p.placementId}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Cards (<768px) */}
            <div className="data-card-list" style={{ padding: 'var(--space-4)' }}>
              {paginatedPlacements.map((p) => (
                <div key={p.placementId} className="data-card">
                  <div className="data-card-header">
                    <div>
                      <div className="data-card-title">{p.student?.name || `Student #${p.student?.studentId}`}</div>
                      <div className="data-card-subtitle">
                        {p.company?.companyName} • {p.job?.jobTitle}
                      </div>
                    </div>
                    <div className="data-card-badge">
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatSalary(p.packageAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="data-card-grid">
                    <div className="data-card-field">
                      <div className="data-card-field-label">Student ID</div>
                      <div className="data-card-field-value">#{p.student?.studentId}</div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Offer Date</div>
                      <div className="data-card-field-value">{formatDate(p.placementDate)}</div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Joining Date</div>
                      <div className="data-card-field-value">{p.joiningDate ? formatDate(p.joiningDate) : 'TBD'}</div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Placement ID</div>
                      <div className="data-card-field-value">#{p.placementId}</div>
                    </div>
                  </div>

                  <div className="data-card-footer">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Record #{p.placementId}
                    </span>

                    <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleView(p)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      {!isStudent && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-danger"
                          onClick={() => setPlacementToDelete(p)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPlacements.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* View Placement Modal (Offer Letter Style) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Placement Record Details"
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedPlacement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Offer Summary Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Confirmed Package
                </span>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                  {formatSalary(selectedPlacement.packageAmount)}
                </div>
              </div>
              <Sparkles size={28} style={{ color: 'var(--color-primary-600)' }} />
            </div>

            {/* Definition Grid */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Placed Student
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginTop: '2px' }}>
                  {selectedPlacement.student?.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Student ID: #{selectedPlacement.student?.studentId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Hiring Partner
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginTop: '2px' }}>
                  {selectedPlacement.company?.companyName}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Company ID: #{selectedPlacement.company?.companyId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Job Role
                </div>
                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {selectedPlacement.job?.jobTitle}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Placement ID
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  #{selectedPlacement.placementId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Offer Date
                </div>
                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {formatDate(selectedPlacement.placementDate)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Joining Date
                </div>
                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {selectedPlacement.joiningDate ? formatDate(selectedPlacement.joiningDate) : 'Pending onboarding schedule'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Placement Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record New Placement"
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
              id="submit-record-placement-btn"
            >
              Confirm Placement
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <FormInput
              label="Placement Record ID"
              name="placementId"
              type="number"
              value={formData.placementId}
              onChange={(e) => setFormData({ ...formData, placementId: e.target.value })}
              placeholder="e.g. 503"
              required
              error={formErrors.placementId}
              helpText="Unique positive numeric placement ID"
            />

            <FormSelect
              label="Placed Student"
              name="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              options={students.map((s) => ({
                value: s.studentId,
                label: `${s.name} (ID: ${s.studentId}, Status: ${s.placementStatus})`,
              }))}
              required
              error={formErrors.studentId}
            />

            <FormSelect
              label="Recruiting Company"
              name="companyId"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              options={companies.map((c) => ({
                value: c.companyId,
                label: `${c.companyName} (ID: ${c.companyId})`,
              }))}
              required
              error={formErrors.companyId}
            />

            <FormSelect
              label="Job Role"
              name="jobId"
              value={formData.jobId}
              onChange={(e) => {
                const jId = e.target.value;
                const foundJob = jobs.find((j) => String(j.jobId) === String(jId));
                setFormData({
                  ...formData,
                  jobId: jId,
                  packageAmount: foundJob?.packageAmount ? String(foundJob.packageAmount) : formData.packageAmount,
                });
              }}
              options={jobs.map((j) => ({
                value: j.jobId,
                label: `${j.jobTitle} @ ${j.company?.companyName || ''} (${formatSalary(j.packageAmount)})`,
              }))}
              required
              error={formErrors.jobId}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <FormInput
                label="Offer Date"
                name="placementDate"
                type="date"
                value={formData.placementDate}
                onChange={(e) => setFormData({ ...formData, placementDate: e.target.value })}
                required
                error={formErrors.placementDate}
              />

              <FormInput
                label="Agreed CTC (INR)"
                name="packageAmount"
                type="number"
                step="1000"
                value={formData.packageAmount}
                onChange={(e) => setFormData({ ...formData, packageAmount: e.target.value })}
                placeholder="800000"
                required
                error={formErrors.packageAmount}
              />
            </div>

            <FormInput
              label="Joining Date (Optional)"
              name="joiningDate"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />

            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Note: Saving this placement activates the database trigger <code>update_student_placement_status</code>, updating the student's status to <strong>PLACED</strong>.
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!placementToDelete}
        onClose={() => setPlacementToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Placement Record"
        message={`Are you sure you want to delete placement record #${placementToDelete?.placementId} for "${placementToDelete?.student?.name}"? Note: this action permanently removes the placement record.`}
        confirmText="Delete Record"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default PlacementsPage;
