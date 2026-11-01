import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  GraduationCap,
  Users,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { departmentsApi } from '../api/departments';
import { studentsApi } from '../api/students';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { SearchInput } from '../components/common/SearchInput';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FormInput } from '../components/forms/FormInput';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function DepartmentsPage() {
  const { toast } = useToast();

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

  // Delete Confirmation Dialog State
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
        await departmentsApi.update(editingDept.departmentId, {
          departmentName: normalizedName,
        });
        toast.success(`Department "${normalizedName}" updated successfully.`);
      } else {
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
        toast.success(`Department "${normalizedName}" created successfully.`);
      }

      setIsFormModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err?.message || 'Failed to save department.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handlers for Delete Dialog
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
        `Cannot delete department "${selectedDeptForDelete.departmentName}" because it is currently assigned to ${count} student record(s).`
      );
      return;
    }

    try {
      setDeleteSubmitting(true);
      setDeleteError('');
      await departmentsApi.delete(selectedDeptForDelete.departmentId);
      toast.success(`Department "${selectedDeptForDelete.departmentName}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete department.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const deleteEnrolledCount = selectedDeptForDelete
    ? studentCountByDept[selectedDeptForDelete.departmentId] || 0
    : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">
            Configure university academic disciplines and track student enrollment counts.
          </p>
        </div>

        <div className="page-header-actions">
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

      {/* Metrics Row (Compact variant per Quiet Ledger) */}
      <div className="metrics-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <MetricCard
          label="Total Departments"
          value={totalDepartments}
          icon={Building2}
          variant="compact"
          context="Academic disciplines"
        />
        <MetricCard
          label="Enrolled Students"
          value={totalEnrolledStudents}
          icon={GraduationCap}
          variant="compact"
          context="Across all departments"
        />
        <MetricCard
          label="Active Disciplines"
          value={activeDepartmentsCount}
          icon={Users}
          variant="compact"
          context="With registered students"
        />
      </div>

      {/* Main Content Card */}
      <Card>
        {/* FilterBar */}
        <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by department name or ID..."
            className="filter-search"
          />
          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredDepartments.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{totalDepartments}</strong> departments
          </div>
        </div>

        {/* State Display: Loading, Error, Empty, or Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : error ? (
          <ErrorState
            title="Couldn't load departments"
            message={error}
            onRetry={loadData}
          />
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No matching departments' : 'No departments yet'}
            message={
              searchQuery
                ? 'No departments match your search query. Try clearing the search.'
                : 'No academic departments have been configured. Add the first department to register students.'
            }
            action={
              searchQuery ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
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
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ minWidth: '240px' }}>Department Name</th>
                  <th className="col-numeric" style={{ width: '180px', textAlign: 'right' }}>Enrolled Students</th>
                  <th className="col-actions" style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => {
                  const studentCount = studentCountByDept[dept.departmentId] || 0;
                  return (
                    <tr key={dept.departmentId}>
                      <td style={{ width: '80px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        #{dept.departmentId}
                      </td>
                      <td style={{ minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Building2 size={16} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {dept.departmentName}
                          </span>
                        </div>
                      </td>
                      <td className="col-numeric" style={{ width: '180px', textAlign: 'right' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: studentCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                          {studentCount}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-1)' }}>
                          {studentCount === 1 ? 'student' : 'students'}
                        </span>
                      </td>
                      <td className="col-actions" style={{ width: '160px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEditModal(dept)}
                            title="Edit department name"
                            aria-label={`Edit ${dept.departmentName}`}
                          >
                            <Pencil size={15} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleOpenDeleteModal(dept)}
                            title={
                              studentCount > 0
                                ? 'Referenced by enrolled students (protected)'
                                : 'Delete department'
                            }
                            aria-label={`Delete ${dept.departmentName}`}
                          >
                            {studentCount > 0 ? (
                              <Lock size={15} style={{ color: 'var(--color-text-muted)' }} />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            <span style={{ color: studentCount > 0 ? 'var(--color-text-muted)' : 'var(--color-danger-600)' }}>
                              Delete
                            </span>
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

      {/* Create / Edit Department Modal */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => !formSubmitting && setIsFormModalOpen(false)}
          title={editingDept ? 'Edit Department' : 'Add Department'}
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormModalOpen(false)}
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFormSubmit}
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving…</span>
                  </>
                ) : editingDept ? (
                  <span>Update Department</span>
                ) : (
                  <span>Create Department</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleFormSubmit}>
            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }} role="alert">
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <FormInput
              label={`Department ID ${editingDept ? '(Locked)' : '(Optional)'}`}
              type="number"
              placeholder={editingDept ? '' : 'Leave empty to auto-assign ID'}
              value={formDeptId}
              onChange={(e) => setFormDeptId(e.target.value)}
              disabled={!!editingDept}
              helperText={
                editingDept
                  ? 'Primary key ID cannot be modified after creation.'
                  : 'Leave blank to automatically calculate the next sequence ID.'
              }
              min={1}
            />

            <FormInput
              label="Department Name"
              type="text"
              placeholder="e.g. Computer Science, Mechanical Engineering"
              value={formDeptName}
              onChange={(e) => setFormDeptName(e.target.value)}
              required
              maxLength={100}
              helperText="Must be unique across all departments. Maximum 100 characters."
              autoFocus
            />
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteModalOpen && selectedDeptForDelete && (
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={() => !deleteSubmitting && setIsDeleteModalOpen(false)}
          onConfirm={deleteEnrolledCount > 0 ? () => setIsDeleteModalOpen(false) : handleDeleteSubmit}
          title={deleteEnrolledCount > 0 ? 'Deletion Blocked' : 'Delete this department?'}
          type={deleteEnrolledCount > 0 ? 'warning' : 'danger'}
          confirmLabel={deleteEnrolledCount > 0 ? 'Close' : 'Delete Department'}
          cancelLabel={deleteEnrolledCount > 0 ? null : 'Cancel'}
          confirmLoading={deleteSubmitting}
          message={
            <div>
              {deleteError && (
                <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }} role="alert">
                  <AlertTriangle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              {deleteEnrolledCount > 0 ? (
                <div>
                  <div className="alert alert-warning" style={{ marginBottom: 'var(--space-3)' }}>
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Department has enrolled students.</strong>
                      <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)' }}>
                        Department <strong>"{selectedDeptForDelete.departmentName}"</strong> is currently assigned to{' '}
                        <strong>{deleteEnrolledCount}</strong> student record(s). Retain this department to preserve academic and placement history.
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    To delete this department, first reassign or remove all enrolled students from the roster.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Are you sure you want to permanently delete <strong>"{selectedDeptForDelete.departmentName}"</strong>? This department has 0 enrolled students and cannot be undone.
                </p>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}

export default DepartmentsPage;

