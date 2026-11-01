import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CalendarClock,
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  ArrowRight,
  UserCircle,
  Clock,
  Check,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import { interviewsApi } from '../api/interviews';
import { placementsApi } from '../api/placements';
import { useAuth } from '../contexts/AuthContext';

import MetricCard from '../components/common/MetricCard';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid, SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [placements, setPlacements] = useState([]);

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, appsRes, interviewsRes, placementsRes] = await Promise.all([
        studentsApi.getMyProfile().catch(() => null),
        applicationsApi.getAll().catch(() => []),
        interviewsApi.getAll().catch(() => []),
        placementsApi.getAll().catch(() => []),
      ]);

      setStudent(profileRes);
      setApplications(appsRes || []);
      setInterviews(interviewsRes || []);
      setPlacements(placementsRes || []);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
      setError(err.message || 'Unable to load your dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Derived metrics
  const stats = useMemo(() => {
    const totalApps = applications.length;
    const applied = applications.filter((a) => a.status === 'APPLIED').length;
    const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length;
    const selected = applications.filter((a) => a.status === 'SELECTED').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingInterviewsList = interviews.filter((i) => {
      const interviewDate = i.interviewDate ? String(i.interviewDate).split('T')[0] : '';
      const isPending = !i.result || i.result === 'Pending' || i.result === 'SCHEDULED';
      return isPending && interviewDate >= todayStr;
    });

    const activePlacement = placements.length > 0 ? placements[0] : null;
    const isPlaced = student?.placementStatus === 'PLACED' || !!activePlacement;

    return {
      totalApps,
      applied,
      shortlisted,
      selected,
      upcomingInterviewsCount: upcomingInterviewsList.length,
      nextInterview: upcomingInterviewsList[0] || null,
      activePlacement,
      isPlaced,
      backlogs: student?.backlogs || 0,
    };
  }, [applications, interviews, placements, student]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '140px', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--color-surface)', opacity: 0.7 }} />
        <SkeletonMetricsGrid count={4} />
        <SkeletonTable rows={4} cols={4} />
      </div>
    );
  }

  if (error && !student) {
    return (
      <ErrorState
        title="Could Not Load Student Portal"
        message={error}
        onRetry={loadStudentData}
      />
    );
  }

  const nextInterviewDate = stats.nextInterview?.interviewDate
    ? new Date(stats.nextInterview.interviewDate)
    : null;
  const isInterviewToday = nextInterviewDate
    ? nextInterviewDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">Student Dashboard</h1>
          <p className="page-header-subtitle">
            Welcome back, {student?.name || user?.email?.split('@')[0] || 'Candidate'}
          </p>
        </div>
      </div>

      {/* 1. Hero Identity Banner (Solid primary-900, Quiet Ledger principle) */}
      <div
        style={{
          backgroundColor: 'var(--color-primary-900)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--color-primary-200)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Candidate Identity
            </span>
            <span style={{ color: 'var(--color-primary-300)' }}>•</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-200)' }}>
              Class of {student?.graduationYear || '2026'}
            </span>
          </div>

          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            {student?.name || 'Student Candidate'}
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-3)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary-100)',
              marginTop: 'var(--space-1)',
            }}
          >
            <span>Roll #{student?.studentId}</span>
            <span>•</span>
            <span>{student?.department?.departmentName || 'Department'}</span>
            <span>•</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              CGPA {student?.cgpa !== undefined && student?.cgpa !== null ? Number(student.cgpa).toFixed(2) : '—'} / 10.00
            </span>
            <span>•</span>
            <span>
              {stats.backlogs === 0 ? '0 Backlogs' : `${stats.backlogs} Backlog(s)`}
            </span>
          </div>
        </div>

        <div>
          <StatusBadge status={stats.isPlaced ? 'PLACED' : 'NOT_PLACED'} />
        </div>
      </div>

      {/* 2. "What's Next" Priority Card */}
      {stats.isPlaced && stats.activePlacement ? (
        <Card style={{ borderLeft: '4px solid var(--color-success)' }}>
          <CardBody style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Award size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Official Offer Received
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>
                    {stats.activePlacement.company?.companyName || 'Corporate Partner'} — {stats.activePlacement.job?.jobTitle || 'Placement Role'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    Package: {formatSalary(stats.activePlacement.packageAmount || stats.activePlacement.package)} • Joining {formatDate(stats.activePlacement.joiningDate)}
                  </p>
                </div>
              </div>

              <Link to="/my-placement" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  <span>View Offer Letter</span>
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : stats.nextInterview ? (
        <Card style={{ borderLeft: isInterviewToday ? '4px solid var(--color-warning)' : '4px solid var(--color-info)' }}>
          <CardBody style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {/* Date Block */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-hover)',
                    border: '1px solid var(--color-border)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {nextInterviewDate ? nextInterviewDate.getDate() : '—'}
                  </span>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {nextInterviewDate ? nextInterviewDate.toLocaleString('default', { month: 'short' }) : ''}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                    <CategoryTag>{stats.nextInterview.roundType || `Round ${stats.nextInterview.roundNumber}`}</CategoryTag>
                    {isInterviewToday ? (
                      <span className="badge badge-warning">Today</span>
                    ) : (
                      <span className="badge badge-info">Upcoming</span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>
                    {stats.nextInterview.job?.company?.companyName || 'Recruiting Company'} — {stats.nextInterview.job?.jobTitle || 'Role'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Scheduled for {formatDate(stats.nextInterview.interviewDate)}
                  </p>
                </div>
              </div>

              <Link to="/my-interviews" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <span>Interview Details</span>
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <CalendarClock size={20} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    No interviews scheduled at this time
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Explore verified campus drives and apply to active job listings.
                  </p>
                </div>
              </div>

              <Link to="/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <span>Browse Open Jobs</span>
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 3. Metric Strip (Compact) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <MetricCard
          compact
          title="Applications"
          value={stats.totalApps}
          icon={FileText}
          context={`${stats.applied} Under Review`}
        />
        <MetricCard
          compact
          title="Shortlisted"
          value={stats.shortlisted}
          icon={Briefcase}
          variant="warning"
          context={`${stats.selected} Selected`}
        />
        <MetricCard
          compact
          title="Interviews"
          value={stats.upcomingInterviewsCount}
          icon={CalendarClock}
          variant="info"
          context={stats.upcomingInterviewsCount > 0 ? 'Action required' : 'Clear schedule'}
        />
        <MetricCard
          compact
          title="Active Backlogs"
          value={stats.backlogs}
          icon={Award}
          variant={stats.backlogs > 0 ? 'danger' : 'success'}
          context={stats.backlogs === 0 ? 'Academic clear' : 'Policy constraint'}
        />
      </div>

      {/* 4. Active Applications Funnel Table */}
      <Card>
        <CardHeader
          title="Recent Applications"
          subtitle="Your submission pipeline and selection rounds"
          action={
            <Link to="/my-applications" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">
                <span>View All ({applications.length})</span>
                <ArrowRight size={14} strokeWidth={1.75} />
              </Button>
            </Link>
          }
        />
        <CardBody style={{ padding: 0 }}>
          {applications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications submitted yet"
              description="Browse open campus drives and submit your profile for available roles."
              actionText="Browse Jobs"
              actionIcon={Briefcase}
              onAction={() => {}}
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Job & Company</th>
                    <th>Compensation</th>
                    <th>Date Applied</th>
                    <th>Progress Funnel</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((app) => {
                    const isShortlisted = app.status === 'SHORTLISTED' || app.status === 'SELECTED';
                    const isDecision = app.status === 'SELECTED' || app.status === 'REJECTED';

                    return (
                      <tr key={app.applicationId}>
                        <td>
                          <div className="cell-primary">
                            <span className="cell-title">{app.job?.jobTitle || `Job #${app.jobId}`}</span>
                            <span className="cell-subtitle">{app.job?.company?.companyName || 'Corporate Partner'}</span>
                          </div>
                        </td>
                        <td className="col-numeric">
                          {formatSalary(app.job?.packageAmount || app.job?.package)}
                        </td>
                        <td>{formatDate(app.applicationDate)}</td>
                        <td>
                          {/* Mini Stepper (Applied -> Shortlisted -> Selected/Rejected) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={`Stage: ${app.status}`}>
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary-600)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                              }}
                              aria-hidden="true"
                            >
                              <Check size={11} strokeWidth={2.5} />
                            </span>
                            <span style={{ width: '16px', height: '2px', backgroundColor: isShortlisted ? 'var(--color-primary-600)' : 'var(--color-border)' }} />
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: isShortlisted ? 'var(--color-primary-600)' : 'var(--color-surface)',
                                border: `2px solid ${isShortlisted ? 'var(--color-primary-600)' : 'var(--color-border-strong)'}`,
                                color: isShortlisted ? '#FFFFFF' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                              }}
                              aria-hidden="true"
                            >
                              {isShortlisted ? <Check size={11} strokeWidth={2.5} /> : '2'}
                            </span>
                            <span style={{ width: '16px', height: '2px', backgroundColor: isDecision ? 'var(--color-primary-600)' : 'var(--color-border)' }} />
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: app.status === 'SELECTED' ? 'var(--color-success)' : app.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-surface)',
                                border: `2px solid ${isDecision ? (app.status === 'SELECTED' ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-border-strong)'}`,
                                color: isDecision ? '#FFFFFF' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                              }}
                              aria-hidden="true"
                            >
                              {isDecision ? <Check size={11} strokeWidth={2.5} /> : '3'}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <StatusBadge status={app.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 5. Quick Links */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <div className="card card-interactive" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="metric-card-icon-wrap" aria-hidden="true">
                  <Briefcase size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Browse Open Jobs
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Check eligibility and apply to recruitment drives
                  </p>
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        </Link>

        <Link to="/my-profile" style={{ textDecoration: 'none' }}>
          <div className="card card-interactive" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="metric-card-icon-wrap" aria-hidden="true">
                  <UserCircle size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    View My Profile
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Verify academic records, CGPA, and contact details
                  </p>
                </div>
              </div>
              <ArrowRight size={16} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default StudentDashboardPage;
