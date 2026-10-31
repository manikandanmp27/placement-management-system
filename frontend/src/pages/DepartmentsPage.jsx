import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Users,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { departmentsApi } from '../api/departments';
import { studentsApi } from '../api/students';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function DepartmentsPage() {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formDeptId, setFormDeptId] = useState('');
  const [formDeptName, setFormDeptName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeptForDelete, setSelectedDeptForDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [deptData, studentData] = await Promise.all([
        departmentsApi.getAll(),
        studentsApi.getAll({ includeArchived: true }).catch(() => []),
      ]);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
    } catch (err) {
      setError(err?.message || 'Failed to load department records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map student counts per department
  const studentCountByDept = useMemo(() => {
    const counts = {};
    students.forEach((student) => {
      const deptId = student.department?.departmentId;
      if (deptId) {
        counts[deptId] = (counts[deptId] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter(
      (dept) =>
        dept.departmentName?.toLowerCase().includes(query) ||
        String(dept.departmentId).includes(query)
    );
  }, [departments, searchQuery]);

  // Metrics
  const totalDepartments = departments.length;
  const totalEnrolledStudents = students.length;
  const activeDepartmentsCount = useMemo(() => {
    return departments.filter((d) => (studentCountByDept[d.departmentId] || 0) > 0).length;
  }, [departments, studentCountByDept]);

  // Handlers for Form Modal (Create / Edit)
  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormDeptId('');
    setFormDeptName('');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setEditingDept(dept);
    setFormDeptId(String(dept.departmentId));
    setFormDeptName(dept.departmentName || '');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const normalizedName = formDeptName.trim();
    if (!normalizedName) {
      setFormError('Department name is required.');
      return;
    }
    if (normalizedName.length > 100) {
      setFormError('Department name cannot exceed 100 characters.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingDept) {
        // Update existing department
        await departmentsApi.update(editingDept.departmentId, {
          departmentName: normalizedName,
        });
        showToast(`Department "${normalizedName}" updated successfully.`, 'success');
      } else {
        // Create new department
        const payload = {
          departmentName: normalizedName,
        };
        if (formDeptId && formDeptId.trim()) {
          const parsedId = parseInt(formDeptId.trim(), 10);
          if (isNaN(parsedId) || parsedId <= 0) {
            setFormError('Department ID must be a positive integer.');
            setFormSubmitting(false);
            return;
          }
          payload.departmentId = parsedId;
        }

        await departmentsApi.create(payload);
        showToast(`Department "${normalizedName}" created successfully.`, 'success');
      }

      setIsFormModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err?.message || 'Failed to save department.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handlers for Delete Modal
  const handleOpenDeleteModal = (dept) => {
    setSelectedDeptForDelete(dept);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDeptForDelete) return;

    const count = studentCountByDept[selectedDeptForDelete.departmentId] || 0;
    if (count > 0) {
      setDeleteError(
        `Cannot delete department "${selectedDeptForDelete.departmentName}" because it is currently assigned to ${count} student record(s). Retain this department to preserve academic history.`
      );
      return;
    }

    try {
      setDeleteSubmitting(true);
      setDeleteError('');
      await departmentsApi.delete(selectedDeptForDelete.departmentId);
      showToast(
        `Department "${selectedDeptForDelete.departmentName}" deleted successfully.`,
        'success'
      );
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete department.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
              }}
            >
              <Building size={20} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Department Management
            </h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Configure and govern university academic disciplines for student eligibility and placement analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh departments"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <MetricCard
          title="Total Departments"
          value={totalDepartments}
          icon={Building}
          variant="primary"
          subtitle="Academic disciplines"
        />
        <MetricCard
          title="Enrolled Students"
          value={totalEnrolledStudents}
          icon={GraduationCap}
          variant="success"
          subtitle="Across all departments"
        />
        <MetricCard
          title="Active in Roster"
          value={activeDepartmentsCount}
          icon={Users}
          variant="default"
          subtitle="With registered students"
        />
      </div>

      {/* Main Content Card */}
      <Card>
        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by department name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Showing <strong>{filteredDepartments.length}</strong> of <strong>{totalDepartments}</strong> departments
          </div>
        </div>

        {/* State Display: Loading, Error, Empty, or Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : error ? (
          <ErrorState
            title="Failed to Load Departments"
            message={error}
            onRetry={loadData}
          />
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            title="No Departments Found"
            message={
              searchQuery
                ? 'No departments match your search query. Try clearing your search.'
                : 'No academic departments have been added yet. Click "Add Department" above to create the first department.'
            }
            action={
              searchQuery ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={15} />
                  <span>Add Department</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>ID</th>
                  <th>Department Name</th>
                  <th>Associated Students</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', width: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => {
                  const studentCount = studentCountByDept[dept.departmentId] || 0;
                  return (
                    <tr key={dept.departmentId}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          #{dept.departmentId}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building size={16} style={{ color: 'var(--color-primary)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {dept.departmentName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${studentCount > 0 ? 'badge-info' : 'badge-neutral'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 600,
                          }}
                        >
                          <GraduationCap size={12} />
                          {studentCount} {studentCount === 1 ? 'Student' : 'Students'} Enrolled
                        </span>
                      </td>
                      <td>
                        {studentCount > 0 ? (
                          <span className="badge badge-success">
                            <span className="badge-dot" />
                            In Active Use
                          </span>
                        ) : (
                          <span className="badge badge-neutral">
                            <span className="badge-dot" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditModal(dept)}
                            title="Edit department name"
                            style={{ padding: '0.25rem 0.55rem' }}
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenDeleteModal(dept)}
                            title={
                              studentCount > 0
                                ? 'Referenced by enrolled students (protected)'
                                : 'Delete department'
                            }
                            style={{
                              padding: '0.25rem 0.55rem',
                              color: studentCount > 0 ? 'var(--color-text-muted)' : 'var(--color-danger)',
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
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

      {/* ========================================================================= */}
      {/* 1. Create / Edit Department Modal                                         */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => !formSubmitting && setIsFormModalOpen(false)}
          title={editingDept ? 'Edit Academic Department' : 'Add Academic Department'}
        >
          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {editingDept
                  ? `Update the name of department #${editingDept.departmentId}. Academic records referencing this ID will reflect the updated name.`
                  : 'Add a new academic department to the university placement registry.'}
              </p>

              {formError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Department ID */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="form-dept-id">
                  Department ID {editingDept ? '(Locked)' : '(Optional)'}
                </label>
                <input
                  id="form-dept-id"
                  type="number"
                  className="form-input"
                  placeholder={editingDept ? '' : 'Leave empty to auto-assign ID'}
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  disabled={!!editingDept}
                  min={1}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  {editingDept
                    ? 'Primary key ID cannot be modified after creation.'
                    : 'Leave blank to automatically calculate the next available numeric sequence ID.'}
                </div>
              </div>

              {/* Department Name */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="form-dept-name">
                  Department Name / Discipline <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="form-dept-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science, Mechanical Engineering, ECE"
                  value={formDeptName}
                  onChange={(e) => setFormDeptName(e.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Must be unique across all departments. Maximum 100 characters.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormModalOpen(false)}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : editingDept ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Update Department</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Create Department</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. Delete Confirmation Modal                                              */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && selectedDeptForDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !deleteSubmitting && setIsDeleteModalOpen(false)}
          title="Delete Academic Department"
        >
          <div>
            {deleteError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Check if students are enrolled in this department */}
            {(studentCountByDept[selectedDeptForDelete.departmentId] || 0) > 0 ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-warning)',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertTriangle size={24} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                      Department in Active Use (Deletion Blocked)
                    </div>
                    <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      Department <strong>"{selectedDeptForDelete.departmentName}"</strong> is currently assigned to{' '}
                      <strong>{studentCountByDept[selectedDeptForDelete.departmentId]}</strong> student record(s).
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Recommendation:</strong> Retain this department to preserve academic transcripts, candidate eligibility histories, and placement records. If necessary, reassign all students to another department prior to deletion.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Close & Retain Department
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                  Are you sure you want to delete department "{selectedDeptForDelete.departmentName}"?
                </p>

                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  This department has no enrolled students. Once deleted, this academic discipline will no longer be available for student enrollment or placement statistics.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deleteSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteSubmit}
                    disabled={deleteSubmitting}
                  >
                    {deleteSubmitting ? (
                      <>
                        <RefreshCw size={15} className="spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DepartmentsPage;
