import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Eye,
  Filter,
  Phone,
  Mail,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { departmentsApi } from '../api/departments';
import { useToast } from '../contexts/ToastContext';

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

export function StudentsPage() {
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    graduationYear: new Date().getFullYear(),
    cgpa: '',
    backlogs: '0',
    placementStatus: 'NOT_PLACED',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, deptsData] = await Promise.all([
        studentsApi.getAll(),
        departmentsApi.getAll(),
      ]);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter]);

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setIsDeleting(true);
      await studentsApi.delete(studentToDelete.studentId);
      toast.success(`Student ${studentToDelete.name} was successfully removed.`);
      setStudentToDelete(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete student:', err);
      toast.error(err.message || 'Failed to delete student.');
    } finally {
      setIsDeleting(false);
    }
  };

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
    e.preventDefault();
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
        graduationYear: new Date().getFullYear(),
        cgpa: '',
        backlogs: '0',
        placementStatus: 'NOT_PLACED',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create student:', err);
      toast.error(err.message || 'Failed to create student. Please verify ID/Email uniqueness.');
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
            Students Directory
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Comprehensive directory of registered students, academic CGPA records, and placement status.
          </p>
        </div>

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
            placeholder="Search by name, email, or ID..."
            id="student-search-input"
          />

          <div style={{ minWidth: 200 }}>
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by placement status"
            >
              <option value="">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="NOT_PLACED">Not Placed</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Students: <strong>{filteredStudents.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Students Found"
          description={
            searchQuery || departmentFilter || statusFilter
              ? 'No students match your filter criteria. Try resetting the filters.'
              : 'There are currently no students registered in the system.'
          }
          actionText="Register Student"
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
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Grad Year</th>
                  <th>CGPA</th>
                  <th>Backlogs</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => (
                  <tr key={student.studentId}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{student.studentId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {student.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {student.department?.departmentName || '—'}
                      </span>
                    </td>
                    <td>{student.graduationYear}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            student.cgpa >= 8.5
                              ? 'var(--color-success)'
                              : student.cgpa >= 7.0
                              ? 'var(--color-primary)'
                              : 'var(--color-warning)',
                        }}
                      >
                        {Number(student.cgpa).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {student.backlogs === 0 ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>0</span>
                      ) : (
                        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                          {student.backlogs}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={student.placementStatus} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleViewStudent(student)}
                          aria-label={`View details of ${student.name}`}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleDeleteClick(student)}
                          aria-label={`Delete student ${student.name}`}
                          title="Delete Student"
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}
              >
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedStudent.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Student ID: #{selectedStudent.studentId}
                </span>
                <div style={{ marginTop: '0.35rem' }}>
                  <StatusBadge status={selectedStudent.placementStatus} />
                </div>
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
                  Email Address
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '2px', wordBreak: 'break-all' }}>
                  {selectedStudent.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Phone Number
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.phone || 'Not specified'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Department
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.department?.departmentName || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Graduation Year
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '2px' }}>
                  {selectedStudent.graduationYear}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  CGPA
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px', color: 'var(--color-primary)' }}>
                  {Number(selectedStudent.cgpa).toFixed(2)} / 10.0
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Active Backlogs
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginTop: '2px',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <FormInput
              label="Student ID"
              name="studentId"
              type="number"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              placeholder="e.g. 111"
              required
              error={formErrors.studentId}
              helpText="Unique numeric student identification"
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

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="priya@example.com"
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
              label="Backlogs"
              name="backlogs"
              type="number"
              min="0"
              value={formData.backlogs}
              onChange={(e) => setFormData({ ...formData, backlogs: e.target.value })}
              required
              error={formErrors.backlogs}
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
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete student "${studentToDelete?.name}" (ID #${studentToDelete?.studentId})? This action cannot be reversed.`}
        confirmText="Delete Student"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default StudentsPage;
