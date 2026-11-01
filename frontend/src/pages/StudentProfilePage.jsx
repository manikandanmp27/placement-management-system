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
  Lock,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '140px', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface)', opacity: 0.7 }} />
        <SkeletonMetricsGrid count={3} />
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

  const nameInitials = student?.name
    ? student.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">My Academic Profile</h1>
          <p className="page-header-subtitle">
            Verified academic credentials and placement office records
          </p>
        </div>
        <div className="page-header-actions">
          <Link to="/my-applications" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">
              <FileText size={15} strokeWidth={1.75} />
              <span>My Applications</span>
            </Button>
          </Link>
          <Link to="/jobs" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">
              <Briefcase size={15} strokeWidth={1.75} />
              <span>Browse Jobs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Identity Banner (Solid primary-900, No gradient) */}
      <Card style={{ overflow: 'hidden' }}>
        <div
          style={{
            backgroundColor: 'var(--color-primary-900)',
            padding: 'var(--space-6)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-600)',
                color: '#FFFFFF',
                fontSize: '1.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-2)',
              }}
              aria-hidden="true"
            >
              {nameInitials}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {student?.name}
                </h2>
                <StatusBadge status={student?.placementStatus || 'NOT_PLACED'} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-100)',
                  marginTop: '2px',
                }}
              >
                <span className="record-id" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                  Roll #{student?.studentId}
                </span>
                <span>•</span>
                <span>{student?.department?.departmentName || 'Department'}</span>
                <span>•</span>
                <span>Class of {student?.graduationYear}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Academic & Account Definition Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Academic Parameters */}
        <Card>
          <CardHeader
            title="Academic Credentials"
            subtitle="Verified against institutional exam records"
          />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Student Roll ID</span>
                <span className="record-id" style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  #{student?.studentId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Department</span>
                <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                  {student?.department?.departmentName || '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Cumulative CGPA</span>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ fontSize: 'var(--text-md)', color: 'var(--color-primary-600)' }}>
                    {student?.cgpa !== undefined && student?.cgpa !== null ? Number(student.cgpa).toFixed(2) : '—'}
                  </strong>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: '4px' }}>/ 10.00</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Active Backlogs</span>
                <span>
                  {student?.backlogs === 0 ? (
                    <span className="badge badge-success">
                      <span className="badge-dot" aria-hidden="true" />
                      0 Backlogs (Clear)
                    </span>
                  ) : (
                    <span className="badge badge-danger">
                      <span className="badge-dot" aria-hidden="true" />
                      {student?.backlogs} Active Backlog(s)
                    </span>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Expected Graduation</span>
                <strong style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                  {student?.graduationYear}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Placement Status</span>
                <StatusBadge status={student?.placementStatus || 'NOT_PLACED'} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contact & Account Credentials */}
        <Card>
          <CardHeader
            title="Contact & System Account"
            subtitle="Registered institutional identity and portal access"
          />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Institutional Email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Mail size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{student?.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Contact Telephone</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Phone size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {student?.phone || 'Not recorded'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Portal Account</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{user?.email}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Access Role</span>
                <CategoryTag>ROLE_STUDENT</CategoryTag>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>Session Verification</span>
                <span className="badge badge-success">
                  <span className="badge-dot" aria-hidden="true" />
                  Active Session
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3. Read-Only Policy Alert */}
      <div className="alert alert-info banner" role="status">
        <Lock size={18} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Official Records Governance: </strong>
          Academic credentials (CGPA, active backlogs, graduation class, and department) are synced directly with the university database and locked from direct edits. To request a correction, submit a transcript verification request to the placement cell.
        </div>
      </div>
    </div>
  );
}

export default StudentProfilePage;
