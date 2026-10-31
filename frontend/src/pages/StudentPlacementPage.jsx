import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Sparkles,
  GraduationCap,
  TrendingUp,
  FileText,
  ShieldCheck,
} from 'lucide-react';

import { placementsApi } from '../api/placements';
import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';

export function StudentPlacementPage() {
  const [placement, setPlacement] = useState(null);
  const [student, setStudent] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlacementData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [placementsRes, studentRes, appsRes] = await Promise.all([
        placementsApi.getAll().catch(() => []),
        studentsApi.getMyProfile().catch(() => null),
        applicationsApi.getAll().catch(() => []),
      ]);

      setPlacement(placementsRes && placementsRes.length > 0 ? placementsRes[0] : null);
      setStudent(studentRes);
      setApplicationsCount(appsRes ? appsRes.length : 0);
    } catch (err) {
      console.error('Failed to load my placement details:', err);
      setError(err.message || 'Unable to retrieve your placement details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '180px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonMetricsGrid count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could Not Load Placement Details"
        message={error}
        onRetry={loadPlacementData}
      />
    );
  }

  const isPlaced = !!placement || student?.placementStatus === 'PLACED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>My Placement Status</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Official campus recruitment offer verification and placement records.
        </p>
      </div>

      {isPlaced && placement ? (
        /* PLACED STATE: Verified Placement Offer Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-25px',
                right: '-25px',
                opacity: 0.06,
                pointerEvents: 'none',
              }}
            >
              <Award size={220} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                <CheckCircle size={14} />
                OFFICIALLY PLACED
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success, #10B981)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} />
                Verified Campus Offer
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Congratulations, {student?.name || 'Candidate'}!
            </h1>
            <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text-secondary)', maxWidth: '650px' }}>
              You have secured an official placement offer from <strong>{placement.company?.companyName}</strong> through the university recruitment drive.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '0.75rem',
                marginTop: '1.5rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Offered Package:</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-success, #10B981)' }}>
                {formatSalary(placement.packageAmount)}
              </span>
            </div>
          </div>

          {/* Offer & Corporate Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Offer Specifications */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Award size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Offer Details</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Position / Job Title</span>
                    <strong style={{ fontSize: '0.95rem' }}>{placement.job?.jobTitle || 'Graduate Trainee'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Engagement Model</span>
                    <strong style={{ fontSize: '0.95rem' }}>{placement.job?.jobType || 'Full Time'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Annual CTC Compensation</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-success, #10B981)' }}>
                      {formatSalary(placement.packageAmount)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Offer Date</span>
                    <strong style={{ fontSize: '0.95rem' }}>{formatDate(placement.placementDate)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Expected Joining Date</span>
                    <strong style={{ fontSize: '0.95rem' }}>
                      {placement.joiningDate ? formatDate(placement.joiningDate) : 'To be communicated'}
                    </strong>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Corporate Partner Details */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Building2 size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Corporate Partner</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Company Name</span>
                    <strong style={{ fontSize: '0.95rem' }}>{placement.company?.companyName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Industry Domain</span>
                    <strong style={{ fontSize: '0.95rem' }}>{placement.company?.industry || 'Information Technology'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Office Location</span>
                    <strong style={{ fontSize: '0.95rem' }}>{placement.company?.location || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Corporate Portal</span>
                    {placement.company?.website ? (
                      <a
                        href={placement.company.website.startsWith('http') ? placement.company.website : `https://${placement.company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {placement.company.website.replace(/^https?:\/\//, '')}
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Verification Badge Notice */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <ShieldCheck size={22} style={{ color: 'var(--color-success, #10B981)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <strong>Official Placement Record Verified</strong>: Placement Record #{placement.placementId} has been verified and synchronized with university academic records. Per campus recruitment guidelines, students with confirmed offers are marked as placed.
            </div>
          </div>
        </div>
      ) : (
        /* NOT PLACED STATE: Encouraging, Clear Status */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card>
            <CardBody style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: 'var(--color-warning, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <TrendingUp size={36} />
              </div>

              <div style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
                <StatusBadge status="NOT_PLACED" />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.5rem 0 0.5rem 0' }}>
                Actively Seeking Placement
              </h3>
              <p
                style={{
                  maxWidth: '550px',
                  margin: '0 auto 1.75rem auto',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                }}
              >
                You have not finalized a placement offer yet. University recruitment drives run continuously throughout the academic session. Review eligibility criteria and apply for newly posted opportunities.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/jobs" style={{ textDecoration: 'none' }}>
                  <Button variant="primary">
                    <Briefcase size={16} />
                    Browse Open Job Drives
                  </Button>
                </Link>
                <Link to="/my-applications" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary">
                    <FileText size={16} />
                    Track My Applications ({applicationsCount})
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Checklist / Eligibility Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <Card>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <GraduationCap size={20} style={{ color: 'var(--color-primary)' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Academic Eligibility</h4>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <div>Current CGPA: <strong>{student?.cgpa !== undefined ? Number(student.cgpa).toFixed(2) : '—'} / 10.00</strong></div>
                  <div>Active Academic Backlogs: <strong>{student?.backlogs || 0}</strong></div>
                  <div>Department: <strong>{student?.department?.departmentName || '—'}</strong></div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <FileText size={20} style={{ color: 'var(--color-info, #3B82F6)' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Active Applications</h4>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  You currently have <strong>{applicationsCount}</strong> application(s) submitted across corporate recruitment drives.
                </p>
                <Link to="/my-applications" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  View Application Statuses &rarr;
                </Link>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Award size={20} style={{ color: 'var(--color-warning, #F59E0B)' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Placement Policy</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Once you accept an offer, your placement status will be updated to PLACED by the placement coordinator, and your official offer details will appear here.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPlacementPage;
