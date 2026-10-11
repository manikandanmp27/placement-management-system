import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Eye,
  Building2,
  Calendar,
  GraduationCap,
  Briefcase,
  DollarSign,
  Sparkles,
} from 'lucide-react';

import { placementsApi } from '../api/placements';
import { studentsApi } from '../api/students';
import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
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
import { formatDate, formatSalary } from '../utils/formatters';

export function PlacementsPage() {
  const toast = useToast();

  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

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
        String(p.placementId).includes(q);

      const matchesCompany =
        !companyFilter ||
        String(p.company?.companyId) === String(companyFilter);

      return matchesSearch && matchesCompany;
    });
  }, [placements, searchQuery, companyFilter]);

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
      loadData();
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
    e.preventDefault();
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
      loadData();
    } catch (err) {
      console.error('Failed to create placement:', err);
      toast.error(err.message || 'Failed to record placement. Ensure IDs exist and constraints are satisfied.');
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
            Placement Outcomes
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Verified student corporate recruitment offers, compensation packages, and joining dates.
          </p>
        </div>

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
            placeholder="Search candidate, company, role..."
            id="placement-search-input"
          />

          <div style={{ minWidth: 200 }}>
            <select
              className="form-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by hiring partner"
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

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Placements: <strong>{filteredPlacements.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredPlacements.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Placement Records Found"
          description={
            searchQuery || companyFilter
              ? 'No placement outcomes match the active filters.'
              : 'There are currently no confirmed student placements recorded.'
          }
          actionText="Record Placement"
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
                  <th>Student Candidate</th>
                  <th>Company Partner</th>
                  <th>Job Title</th>
                  <th>Package (CTC)</th>
                  <th>Offer Date</th>
                  <th>Joining Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.map((p) => (
                  <tr key={p.placementId}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{p.placementId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {p.student?.name || `Student #${p.student?.studentId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        ID: #{p.student?.studentId}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {p.company?.companyName}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>
                        {p.job?.jobTitle}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>
                        {formatSalary(p.packageAmount)}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                      {formatDate(p.placementDate)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                      {p.joiningDate ? (
                        formatDate(p.joiningDate)
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>TBD</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleView(p)}
                          aria-label={`View details of placement #${p.placementId}`}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setPlacementToDelete(p)}
                          aria-label={`Delete placement #${p.placementId}`}
                          title="Delete Record"
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
        title={`Placement Record #${selectedPlacement?.placementId}`}
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedPlacement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-success-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Confirmed Package
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success-text)' }}>
                  {formatSalary(selectedPlacement.packageAmount)}
                </div>
              </div>
              <Sparkles size={28} style={{ color: 'var(--color-success)' }} />
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Student
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>
                  {selectedPlacement.student?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  ID: #{selectedPlacement.student?.studentId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Hiring Partner
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>
                  {selectedPlacement.company?.companyName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Job Role
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                  {selectedPlacement.job?.jobTitle}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Offer Date
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                  {formatDate(selectedPlacement.placementDate)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Tentative Joining Date
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                  {selectedPlacement.joiningDate ? formatDate(selectedPlacement.joiningDate) : 'Pending onboarding schedule'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput
              label="Placement Record ID"
              name="placementId"
              type="number"
              value={formData.placementId}
              onChange={(e) => setFormData({ ...formData, placementId: e.target.value })}
              placeholder="e.g. 503"
              required
              error={formErrors.placementId}
              helpText="Unique numeric placement ID"
            />

            <FormSelect
              label="Placed Student"
              name="studentId"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              options={students.map((s) => ({
                value: s.studentId,
                label: `${s.name} (ID: ${s.studentId}, Current: ${s.placementStatus})`,
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
                backgroundColor: 'var(--color-primary-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
              }}
            >
              Note: Inserting this placement automatically triggers database trigger <code>update_student_placement_status</code>, changing the student's status to <strong>PLACED</strong>.
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!placementToDelete}
        onClose={() => setPlacementToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Placement Record"
        message={`Are you sure you want to delete placement #${placementToDelete?.placementId} for "${placementToDelete?.student?.name}"?`}
        confirmText="Delete Record"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default PlacementsPage;
