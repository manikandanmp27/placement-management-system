import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  FileText,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';

export function StudentProfilePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentsApi.getMyProfile();
      setStudent(data);
    } catch (err) {
      console.error('Failed to load student profile:', err);
      setError(err.message || 'Unable to retrieve your profile details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '140px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonMetricsGrid count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could Not Load Profile"
        message={error}
        onRetry={loadProfile}
      />
    );
  }

  const isPlaced = student?.placementStatus === 'PLACED';
  const nameInitials = student?.name
    ? student.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Profile Banner */}
      <Card>
        <CardBody style={{ padding: '1.75rem 2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #2b4acb) 100%)',
                  color: '#ffffff',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0,
                }}
              >
                {nameInitials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{student?.name}</h2>
                  <StatusBadge status={student?.placementStatus || 'NOT_PLACED'} />
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <span>Roll #{student?.studentId}</span>
                  <span>•</span>
                  <span>{student?.department?.departmentName || 'Department'}</span>
                  <span>•</span>
                  <span>Class of {student?.graduationYear}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/my-applications" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <FileText size={15} />
                  My Applications
                </Button>
              </Link>
              <Link to="/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  <Briefcase size={15} />
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 2. Details Two-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Academic Records */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <GraduationCap size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Academic Records</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Student Roll ID</span>
                <strong style={{ fontSize: '0.95rem' }}>#{student?.studentId}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Department</span>
                <strong style={{ fontSize: '0.95rem' }}>{student?.department?.departmentName || '—'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cumulative GPA (CGPA)</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                    {student?.cgpa !== undefined ? Number(student.cgpa).toFixed(2) : '—'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>/ 10.00</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Active Academic Backlogs</span>
                <strong>
                  {student?.backlogs === 0 ? (
                    <span style={{ color: 'var(--color-success, #10B981)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={14} />
                      0 (Clear Record)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-warning, #f59e0b)' }}>
                      {student?.backlogs} Active Backlog(s)
                    </span>
                  )}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Graduation Year</span>
                <strong style={{ fontSize: '0.95rem' }}>{student?.graduationYear}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Placement Status</span>
                <StatusBadge status={student?.placementStatus || 'NOT_PLACED'} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contact & Account Credentials */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Contact & Portal Account</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Full Candidate Name</span>
                <strong style={{ fontSize: '0.95rem' }}>{student?.name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Institutional Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={13} style={{ color: 'var(--color-text-muted)' }} />
                  <strong style={{ fontSize: '0.95rem' }}>{student?.email}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Telephone Number</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={13} style={{ color: 'var(--color-text-muted)' }} />
                  <strong style={{ fontSize: '0.95rem' }}>{student?.phone || '—'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Portal User Account</span>
                <strong style={{ fontSize: '0.95rem' }}>{user?.email}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.65rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Access Role</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                  }}
                >
                  STUDENT CANDIDATE
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Account Status</span>
                <span style={{ color: 'var(--color-success, #10B981)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle size={14} />
                  Active
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3. Advisory Callout Banner */}
      <div
        style={{
          padding: '1.1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
        }}
      >
        <AlertCircle size={20} style={{ color: 'var(--color-info, #3B82F6)', flexShrink: 0, marginTop: '0.15rem' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Important Academic Verification Notice:</strong>
          <br />
          Academic records (CGPA, active backlogs, department affiliation) are synchronized with the university examination database and governed by the Placement Office.
          Students are not permitted to alter academic parameters directly. If you notice any discrepancy in your CGPA or backlog records, please submit an official verification request to your Department Placement Coordinator.
        </div>
      </div>
    </div>
  );
}

export default StudentProfilePage;
