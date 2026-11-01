import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Calendar,
  FileText,
  CalendarClock,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

import { placementsApi } from '../api/placements';
import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import { interviewsApi } from '../api/interviews';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';

export function StudentPlacementPage() {
  const [placement, setPlacement] = useState(null);
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlacementData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [placementsRes, studentRes, appsRes, interviewsRes] = await Promise.all([
        placementsApi.getAll().catch(() => []),
        studentsApi.getMyProfile().catch(() => null),
        applicationsApi.getAll().catch(() => []),
        interviewsApi.getAll().catch(() => []),
      ]);

      setPlacement(placementsRes && placementsRes.length > 0 ? placementsRes[0] : null);
      setStudent(studentRes);
      setApplications(appsRes || []);
      setInterviews(interviewsRes || []);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '180px', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface)', opacity: 0.7 }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">My Placement Status</h1>
          <p className="page-header-subtitle">
            Official campus recruitment offer verification and onboarding status
          </p>
        </div>
      </div>

      {isPlaced && placement ? (
        /* ==========================================================================
           STATE A: OFFICIALLY PLACED
           ========================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Offer Card (White surface, 4px success top border, Quiet Ledger) */}
          <Card style={{ borderTop: '4px solid var(--color-success)', padding: 0 }}>
            <CardBody style={{ padding: 'var(--space-8)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="badge badge-success">
                      <CheckCircle size={13} strokeWidth={2.5} />
                      <span>Verified Campus Placement</span>
                    </span>
                    <span className="record-id" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      REF-#{placement.placementId}
                    </span>
                  </div>

                  <span className="category-tag">
                    {placement.job?.jobType || 'Full Time Engagement'}
                  </span>
                </div>

                <div>
                  <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 var(--space-1)', color: 'var(--color-text-primary)' }}>
                    {placement.company?.companyName || 'Corporate Partner'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)' }}>
                    Position: <strong>{placement.job?.jobTitle || 'Graduate Trainee'}</strong>
                  </p>
                </div>

                {/* Package Callout (Fluid clamp text-3xl, tabular) */}
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                    maxWidth: '420px',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                    Annual Compensation Package (CTC)
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 800,
                      color: 'var(--color-text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}
                  >
                    {formatSalary(placement.packageAmount)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Offer Specifications Definition Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            <Card>
              <CardHeader title="Offer Specifications" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Placement Reference ID</span>
                    <span className="record-id" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      #{placement.placementId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Offer Recording Date</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatDate(placement.placementDate)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Expected Joining Date</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {placement.joiningDate ? formatDate(placement.joiningDate) : 'To be confirmed by employer'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Candidate Status</span>
                    <StatusBadge status="PLACED" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Next Steps & Onboarding Guidelines" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Transcript & Degree Verification: </strong>
                      Ensure all semester marksheets and degree completion certificates are submitted to the placement cell before joining.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Employer Communications: </strong>
                      Keep an active eye on your registered institutional email for formal onboarding kits and pre-joining training details.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>No-Dues Clearance: </strong>
                      Obtain placement clearance from the university coordinator to finalize your institutional placement record.
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           STATE B: ACTIVELY SEEKING PLACEMENT
           ========================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Status Banner */}
          <div className="alert alert-info banner" role="status">
            <ShieldCheck size={20} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Currently Seeking Placement: </strong>
              Your profile is active for campus drives. Keep your resume up to date and check active recruitment drives matching your department criteria.
            </div>
          </div>

          {/* Recruitment Pipeline Summary Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <MetricCard
              compact
              title="Applications Submitted"
              value={applications.length}
              icon={FileText}
              context={`${applications.filter((a) => a.status === 'APPLIED').length} Under review`}
            />
            <MetricCard
              compact
              title="Shortlisted Rounds"
              value={applications.filter((a) => a.status === 'SHORTLISTED' || a.status === 'SELECTED').length}
              icon={Briefcase}
              variant="warning"
              context="Advanced to evaluation"
            />
            <MetricCard
              compact
              title="Scheduled Interviews"
              value={interviews.length}
              icon={CalendarClock}
              variant="info"
              context="Selection rounds"
            />
          </div>

          {/* Call to Action Card */}
          <Card>
            <CardBody style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  <Briefcase size={28} strokeWidth={1.75} />
                </div>

                <div>
                  <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Explore Active Recruitment Drives
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    Partner companies are recruiting across multiple disciplines. Check eligibility criteria and apply with one click.
                  </p>
                </div>

                <Link to="/jobs" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md">
                    <span>Browse Open Jobs</span>
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

export default StudentPlacementPage;
