import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { departmentsApi } from '../api/departments';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

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

const CURRENT_YEAR = new Date().getFullYear();

export function StudentsPage() {
  const toast = useToast();
  const { isOfficer, isAdmin } = useAuth();
  const canManage = isOfficer || isAdmin;

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rosterTab, setRosterTab] = useState('active'); // 'active' | 'archived' | 'all'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // View Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    graduationYear: CURRENT_YEAR,
    cgpa: '',
    backlogs: '0',
    placementStatus: 'NOT_PLACED',
  });
  const [formErrors, setFormErrors] = useState({});

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    graduationYear: CURRENT_YEAR,
    cgpa: '',
    backlogs: '0',
    placementStatus: 'NOT_PLACED',
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  // Action Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archive / Restore State
  const [studentToArchive, setStudentToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Hard Delete State
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const studentParams = {};
      if (rosterTab === 'all') {
        studentParams.includeArchived = true;
      } else if (rosterTab === 'archived') {
        studentParams.archived = true;
      } else {
        studentParams.archived = false;
      }

      const [studentsData, deptsData] = await Promise.all([
        studentsApi.getAll(studentParams),
        departmentsApi.getAll().catch(() => []),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [rosterTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        String(s.studentId).includes(query);

      const matchesDept =
        !departmentFilter ||
        String(s.department?.departmentId) === String(departmentFilter);

      const matchesStatus =
        !statusFilter ||
        s.placementStatus?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [students, searchQuery, departmentFilter, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter, rosterTab]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handlers
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleArchiveClick = (student) => {
    setStudentToArchive(student);
  };

  const handleConfirmArchive = async () => {
    if (!studentToArchive) return;
    try {
      setIsArchiving(true);
      if (studentToArchive.isArchived) {
        await studentsApi.unarchive(studentToArchive.studentId);
        toast.success(`Student ${studentToArchive.name} restored to active roster.`);
      } else {
        await studentsApi.archive(studentToArchive.studentId);
        toast.success(`Student ${studentToArchive.name} moved to archived records.`);
      }
      setStudentToArchive(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update student archive status:', err);
      toast.error(err.message || 'Failed to update student archive status.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentsApi.delete(studentToDelete.studentId);
      toast.success(`Student ${studentToDelete.name} was permanently removed.`);
      setStudentToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete student:', err);
      toast.error(err.message || 'Hard delete failed: student has associated applications, interviews, or placement records. Use Archive instead.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.studentId || isNaN(formData.studentId) || Number(formData.studentId) <= 0) {
      errors.studentId = 'Valid positive student ID is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email address is required';
    }
    if (!formData.departmentId) {
      errors.departmentId = 'Department is required';
    }
    if (!formData.graduationYear || isNaN(formData.graduationYear)) {
      errors.graduationYear = 'Valid graduation year is required';
    }
    if (
      formData.cgpa === '' ||
      isNaN(formData.cgpa) ||
      Number(formData.cgpa) < 0 ||
      Number(formData.cgpa) > 10
    ) {
      errors.cgpa = 'CGPA must be a decimal between 0.00 and 10.00';
    }
    if (formData.backlogs === '' || isNaN(formData.backlogs) || Number(formData.backlogs) < 0) {
      errors.backlogs = 'Backlogs count cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const selectedDept = departments.find(
        (d) => String(d.departmentId) === String(formData.departmentId)
      );

      const payload = {
        studentId: Number(formData.studentId),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        department: {
          departmentId: Number(formData.departmentId),
          departmentName: selectedDept?.departmentName || '',
        },
        graduationYear: Number(formData.graduationYear),
        cgpa: parseFloat(Number(formData.cgpa).toFixed(2)),
        backlogs: Number(formData.backlogs),
        placementStatus: formData.placementStatus,
      };

      await studentsApi.create(payload);
      toast.success(`Student ${payload.name} registered successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        studentId: '',
        name: '',
        email: '',
        phone: '',
        departmentId: '',
        graduationYear: CURRENT_YEAR,
        cgpa: '',
        backlogs: '0',
        placementStatus: 'NOT_PLACED',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create student:', err);
      toast.error(err.message || 'Failed to create student. Please verify ID/Email uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student) => {
    setEditFormData({
      studentId: student.studentId,
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      departmentId: student.department?.departmentId ? String(student.department.departmentId) : '',
      graduationYear: student.graduationYear || CURRENT_YEAR,
      cgpa: student.cgpa !== undefined && student.cgpa !== null ? String(student.cgpa) : '',
      backlogs: student.backlogs !== undefined && student.backlogs !== null ? String(student.backlogs) : '0',
      placementStatus: student.placementStatus || 'NOT_PLACED',
    });
    setEditFormErrors({});
    setIsEditModalOpen(true);
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!editFormData.email.trim() || !/\S+@\S+\.\S+/.test(editFormData.email)) {
      errors.email = 'Valid email address is required';
    }
    if (!editFormData.departmentId) {
      errors.departmentId = 'Department is required';
    }
    if (!editFormData.graduationYear || isNaN(editFormData.graduationYear) || Number(editFormData.graduationYear) <= 0) {
      errors.graduationYear = 'Valid graduation year is required';
    }
    if (
      editFormData.cgpa === '' ||
      isNaN(editFormData.cgpa) ||
      Number(editFormData.cgpa) < 0 ||
      Number(editFormData.cgpa) > 10
    ) {
      errors.cgpa = 'CGPA must be a decimal between 0.00 and 10.00';
    }
    if (editFormData.backlogs === '' || isNaN(editFormData.backlogs) || Number(editFormData.backlogs) < 0) {
      errors.backlogs = 'Backlogs count cannot be negative';
    }
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateStudent = async (e) => {
    if (e) e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setIsSubmitting(true);
      const selectedDept = departments.find(
        (d) => String(d.departmentId) === String(editFormData.departmentId)
      );

      const payload = {
        studentId: Number(editFormData.studentId),
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim() || null,
        department: {
          departmentId: Number(editFormData.departmentId),
          departmentName: selectedDept?.departmentName || '',
        },
        graduationYear: Number(editFormData.graduationYear),
        cgpa: parseFloat(Number(editFormData.cgpa).toFixed(2)),
        backlogs: Number(editFormData.backlogs),
        placementStatus: editFormData.placementStatus,
      };

      await studentsApi.update(editFormData.studentId, payload);
      toast.success(`Student record for ${payload.name} updated successfully!`);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update student:', err);
      toast.error(err.message || 'Failed to update student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            Student directory, academic CGPA records, archive lifecycle, and placement statuses.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh student records"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {canManage && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
              id="btn-register-student"
            >
              Register Student
            </Button>
          )}
        </div>
      </div>

      {/* Roster Tabs with Counts */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setRosterTab('active')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: rosterTab === 'active' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: rosterTab === 'active' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <span>Active Roster</span>
          {rosterTab === 'active' && (
            <span
              style={{
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
              }}
            >
              {filteredStudents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setRosterTab('archived')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: rosterTab === 'archived' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: rosterTab === 'archived' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <span>Archived Records</span>
          {rosterTab === 'archived' && (
            <span
              style={{
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
              }}
            >
              {filteredStudents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setRosterTab('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: rosterTab === 'all' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: rosterTab === 'all' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <span>All Students</span>
          {rosterTab === 'all' && (
            <span
              style={{
                padding: '1px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                backgroundColor: 'var(--color-primary-100)',
                color: 'var(--color-primary-700)',
              }}
            >
              {filteredStudents.length}
            </span>
          )}
        </button>
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
            <div style={{ flex: 1, minWidth: '220px', maxWidth: '380px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, email, or ID..."
                id="student-search-input"
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
                id="student-dept-filter"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '150px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by placement status"
                id="student-status-filter"
              >
                <option value="">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="NOT_PLACED">Not Placed</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredStudents.length}</strong> students
          </div>
        </div>

        {/* State Views */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={
              rosterTab === 'archived'
                ? 'No Archived Students'
                : searchQuery || departmentFilter || statusFilter
                ? 'No Matching Students'
                : 'No Students Registered'
            }
            description={
              rosterTab === 'archived'
                ? 'There are currently no deactivated or archived students in the system.'
                : searchQuery || departmentFilter || statusFilter
                ? 'No students match your filter criteria. Try clearing filters.'
                : 'There are currently no students registered in the system.'
            }
            actionText={
              searchQuery || departmentFilter || statusFilter
                ? 'Clear Filters'
                : canManage && rosterTab !== 'archived'
                ? 'Register Student'
                : undefined
            }
            actionIcon={searchQuery || departmentFilter || statusFilter ? undefined : Plus}
            onAction={
              searchQuery || departmentFilter || statusFilter
                ? () => {
                    setSearchQuery('');
                    setDepartmentFilter('');
                    setStatusFilter('');
                  }
                : canManage && rosterTab !== 'archived'
                ? () => setIsCreateModalOpen(true)
                : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table View (6 Visible Columns per spec 5.5) */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Student</th>
                    <th style={{ width: '160px' }}>Department</th>
                    <th className="col-numeric" style={{ textAlign: 'right', width: '90px' }}>CGPA</th>
                    <th className="col-numeric" style={{ textAlign: 'right', width: '90px' }}>Backlogs</th>
                    <th className="col-status" style={{ width: '140px', textAlign: 'center' }}>Placement Status</th>
                    <th className="col-actions" style={{ textAlign: 'right', width: canManage ? '160px' : '90px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr key={student.studentId}>
                      {/* 1. Student */}
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {student.name}
                          </span>
                          {student.isArchived && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-warning-bg)',
                                color: 'var(--color-warning-text)',
                                border: '1px solid var(--color-warning-border)',
                              }}
                            >
                              Archived
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: #{student.studentId}
                        </div>
                      </td>

                      {/* 2. Department */}
                      <td style={{ width: '160px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {student.department?.departmentName || '—'}
                        </span>
                      </td>

                      {/* 3. CGPA (right, tabular) */}
                      <td className="col-numeric" style={{ width: '90px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {student.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}
                      </td>

                      {/* 4. Backlogs (right, danger if > 0) */}
                      <td className="col-numeric" style={{ width: '90px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {student.backlogs > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            {student.backlogs}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                        )}
                      </td>

                      {/* 5. Placement Status */}
                      <td className="col-status" style={{ width: '140px', textAlign: 'center' }}>
                        <StatusBadge status={student.placementStatus} />
                      </td>

                      {/* 6. Actions */}
                      <td className="col-actions" style={{ width: canManage ? '160px' : '90px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleViewStudent(student)}
                            aria-label={`View details of ${student.name}`}
                            title="View Student Profile"
                            id={`btn-view-student-${student.studentId}`}
                          >
                            <Eye size={15} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleEditClick(student)}
                                aria-label={`Edit ${student.name}`}
                                title="Edit Record"
                                id={`btn-edit-student-${student.studentId}`}
                              >
                                <Pencil size={15} />
                              </button>

                              {student.isArchived ? (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleArchiveClick(student)}
                                  aria-label={`Restore student ${student.name}`}
                                  title="Restore Student"
                                  id={`btn-restore-student-${student.studentId}`}
                                >
                                  <ArchiveRestore size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleArchiveClick(student)}
                                  aria-label={`Archive student ${student.name}`}
                                  title="Archive Student"
                                  id={`btn-archive-student-${student.studentId}`}
                                >
                                  <Archive size={15} />
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => handleDeleteClick(student)}
                                aria-label={`Delete student ${student.name}`}
                                title="Delete Record"
                                id={`btn-delete-student-${student.studentId}`}
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
            <div className="data-card-list" style={{ padding: 'var(--space-4)' }}>
              {paginatedStudents.map((student) => (
                <div key={student.studentId} className="data-card">
                  <div className="data-card-header">
                    <div>
                      <div className="data-card-title">{student.name}</div>
                      <div className="data-card-subtitle">
                        {student.department?.departmentName || 'No Department'} • <span style={{ fontFamily: 'var(--font-mono)' }}>#{student.studentId}</span>
                      </div>
                    </div>
                    <div className="data-card-badge">
                      <StatusBadge status={student.placementStatus} />
                    </div>
                  </div>

                  <div className="data-card-grid">
                    <div className="data-card-field">
                      <div className="data-card-field-label">CGPA</div>
                      <div className="data-card-field-value" style={{ fontWeight: 600 }}>
                        {student.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}
                      </div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Active Backlogs</div>
                      <div className="data-card-field-value">
                        {student.backlogs > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{student.backlogs}</span>
                        ) : (
                          '0'
                        )}
                      </div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Graduation Class</div>
                      <div className="data-card-field-value">{student.graduationYear || '—'}</div>
                    </div>

                    <div className="data-card-field">
                      <div className="data-card-field-label">Roster Status</div>
                      <div className="data-card-field-value">
                        {student.isArchived ? (
                          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Archived</span>
                        ) : (
                          <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="data-card-footer">
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{student.studentId}
                    </span>

                    <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewStudent(student)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleEditClick(student)}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleDeleteClick(student)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
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
              totalItems={filteredStudents.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. View Student Modal (Definition Grid)                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Student Profile"
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-100)',
                  color: 'var(--color-primary-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 'var(--text-xl)',
                  flexShrink: 0,
                }}
              >
                {selectedStudent.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedStudent.name}
                </h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Student ID: #{selectedStudent.studentId}
                </div>
                <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <StatusBadge status={selectedStudent.placementStatus} />
                  {selectedStudent.isArchived && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-warning-bg)',
                        color: 'var(--color-warning-text)',
                        border: '1px solid var(--color-warning-border)',
                      }}
                    >
                      Archived Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Read-Only Definition Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-3)',
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Email Address
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedStudent.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Phone Number
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.phone || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Department
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.department?.departmentName || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Graduation Year
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.graduationYear}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Academic CGPA
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginTop: '2px', color: 'var(--color-primary-600)', fontVariantNumeric: 'tabular-nums' }}>
                  {Number(selectedStudent.cgpa).toFixed(2)} / 10.0
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Active Backlogs
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    marginTop: '2px',
                    fontVariantNumeric: 'tabular-nums',
                    color: selectedStudent.backlogs > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                  }}
                >
                  {selectedStudent.backlogs}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Register New Student Modal (Grouped Layout)                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Student"
        size="lg"
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
              onClick={handleCreateStudent}
              isLoading={isSubmitting}
              id="submit-register-student-btn"
            >
              Register Student
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStudent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Identity Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Identity & Placement
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Student ID"
                  name="studentId"
                  type="number"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. 111"
                  required
                  error={formErrors.studentId}
                  helpText="Unique positive numeric student identifier"
                />

                <FormInput
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  required
                  error={formErrors.name}
                />

                <FormSelect
                  label="Placement Status"
                  name="placementStatus"
                  value={formData.placementStatus}
                  onChange={(e) => setFormData({ ...formData, placementStatus: e.target.value })}
                  options={[
                    { value: 'NOT_PLACED', label: 'NOT_PLACED' },
                    { value: 'PLACED', label: 'PLACED' },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Academic Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Academic Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormSelect
                  label="Academic Department"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  options={departments.map((d) => ({
                    value: d.departmentId,
                    label: d.departmentName,
                  }))}
                  required
                  error={formErrors.departmentId}
                />

                <FormInput
                  label="Graduation Year"
                  name="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  required
                  error={formErrors.graduationYear}
                />

                <FormInput
                  label="CGPA"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  placeholder="e.g. 8.75"
                  required
                  error={formErrors.cgpa}
                  helpText="Scale of 0.00 to 10.00"
                />

                <FormInput
                  label="Active Backlogs"
                  name="backlogs"
                  type="number"
                  min="0"
                  value={formData.backlogs}
                  onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
                  required
                  error={formErrors.backlogs}
                />
              </div>
            </div>

            {/* Contact Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@university.edu"
                  required
                  error={formErrors.email}
                />

                <FormInput
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. Edit Student Modal (Grouped Layout)                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Academic Record"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateStudent}
              isLoading={isSubmitting}
              id="submit-edit-student-btn"
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateStudent}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Identity Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Identity & Placement
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Student ID"
                  name="studentId"
                  type="number"
                  value={editFormData.studentId}
                  disabled
                  helpText="Student ID is permanent and cannot be modified"
                />

                <FormInput
                  label="Full Name"
                  name="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  required
                  error={editFormErrors.name}
                />

                <FormSelect
                  label="Placement Status"
                  name="placementStatus"
                  value={editFormData.placementStatus}
                  onChange={(e) => setEditFormData({ ...editFormData, placementStatus: e.target.value })}
                  options={[
                    { value: 'NOT_PLACED', label: 'NOT_PLACED' },
                    { value: 'PLACED', label: 'PLACED' },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Academic Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Academic Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormSelect
                  label="Academic Department"
                  name="departmentId"
                  value={editFormData.departmentId}
                  onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                  options={departments.map((d) => ({
                    value: d.departmentId,
                    label: d.departmentName,
                  }))}
                  required
                  error={editFormErrors.departmentId}
                />

                <FormInput
                  label="Graduation Year"
                  name="graduationYear"
                  type="number"
                  value={editFormData.graduationYear}
                  onChange={(e) => setEditFormData({ ...editFormData, graduationYear: e.target.value })}
                  required
                  error={editFormErrors.graduationYear}
                />

                <FormInput
                  label="CGPA"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={editFormData.cgpa}
                  onChange={(e) => setEditFormData({ ...editFormData, cgpa: e.target.value })}
                  placeholder="e.g. 8.75"
                  required
                  error={editFormErrors.cgpa}
                  helpText="Scale of 0.00 to 10.00"
                />

                <FormInput
                  label="Active Backlogs"
                  name="backlogs"
                  type="number"
                  min="0"
                  value={editFormData.backlogs}
                  onChange={(e) => setEditFormData({ ...editFormData, backlogs: e.target.value })}
                  required
                  error={editFormErrors.backlogs}
                />
              </div>
            </div>

            {/* Contact Group */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                Contact Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="student@university.edu"
                  required
                  error={editFormErrors.email}
                />

                <FormInput
                  label="Phone Number"
                  name="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. Archive / Restore ConfirmDialog                                        */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!studentToArchive}
        onClose={() => setStudentToArchive(null)}
        onConfirm={handleConfirmArchive}
        title={studentToArchive?.isArchived ? 'Restore Student Record' : 'Archive Student Record'}
        message={
          studentToArchive?.isArchived
            ? `Are you sure you want to restore "${studentToArchive?.name}" (ID #${studentToArchive?.studentId})? Restoring will return this student to the active roster, re-enable their portal login, and make them eligible for active placement drives.`
            : `Are you sure you want to archive "${studentToArchive?.name}" (ID #${studentToArchive?.studentId})? This safe deactivation hides the student from active candidate lists and disables their portal login while strictly preserving all historical applications, interviews, and placement outcomes.`
        }
        confirmText={studentToArchive?.isArchived ? 'Restore Student' : 'Archive Student'}
        variant={studentToArchive?.isArchived ? 'primary' : 'warning'}
        isLoading={isArchiving}
      />

      {/* ========================================================================= */}
      {/* 5. Hard Delete ConfirmDialog                                              */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete student "${studentToDelete?.name}" (ID #${studentToDelete?.studentId})? Notice: Hard deletion will permanently erase this record and is strictly blocked if the student has associated applications, placements, or portal user accounts.`}
        confirmText="Permanently Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default StudentsPage;
