import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CalendarCheck,
  Award,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  User,
  GraduationCap,
  TrendingUp,
  Calendar,
} from 'lucide-react';

import { studentsApi } from '../api/students';
import { applicationsApi } from '../api/applications';
import { interviewsApi } from '../api/interviews';
import { placementsApi } from '../api/placements';
import { useAuth } from '../contexts/AuthContext';

import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
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
    const rejected = applications.filter((a) => a.status === 'REJECTED').length;

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
      rejected,
      upcomingInterviewsCount: upcomingInterviewsList.length,
      nextInterview: upcomingInterviewsList[0] || null,
      activePlacement,
      isPlaced,
    };
  }, [applications, interviews, placements, student]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '140px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonMetricsGrid count={4} />
        <SkeletonTable rows={4} columns={4} />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      {/* 1. Student Profile Hero Banner - Compact & Modern */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark, #2b4acb) 0%, var(--color-primary, #3b5bdb) 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '1.2rem 1.5rem',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            opacity: 0.07,
            pointerEvents: 'none',
          }}
        >
          <GraduationCap size={160} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}
              >
                <Sparkles size={12} />
                Candidate Portal
              </span>
              <span
                style={{
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: stats.isPlaced ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                  color: stats.isPlaced ? '#a7f3d0' : '#fde68a',
                  border: `1px solid ${stats.isPlaced ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {stats.isPlaced ? 'PLACED' : 'ACTIVELY SEEKING'}
              </span>
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
              Welcome back, {student?.name || user?.email?.split('@')[0] || 'Student'}!
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.85rem' }}>
              Roll #{student?.studentId} • {student?.department?.departmentName || 'Academic Department'} • Class of {student?.graduationYear || '2026'}
            </p>

            {/* Quick Profile Specs */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.6rem',
                marginTop: '0.75rem',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ opacity: 0.85 }}>CGPA:</span>
                <strong>{student?.cgpa !== undefined && student?.cgpa !== null ? Number(student.cgpa).toFixed(2) : '—'} / 10.00</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ opacity: 0.85 }}>Backlogs:</span>
                <strong>
                  {student?.backlogs === 0 ? '0 (Clear)' : `${student?.backlogs || 0}`}
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ opacity: 0.85 }}>Email:</span>
                <strong>{student?.email || user?.email}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignSelf: 'flex-start' }}>
            <Link to="/my-profile" style={{ textDecoration: 'none' }}>
              <Button
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-primary-dark, #2b4acb)',
                  border: 'none',
                  fontWeight: 600,
                  padding: '0.45rem 0.85rem',
                }}
              >
                <User size={14} />
                My Profile
              </Button>
            </Link>
            <Link to="/jobs" style={{ textDecoration: 'none' }}>
              <Button
                variant="secondary"
                size="sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  fontWeight: 600,
                  padding: '0.45rem 0.85rem',
                }}
              >
                <Briefcase size={14} />
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid - Minimalistic, Compact & Responsive */}
      <div
        className="metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        <MetricCard
          compact
          title="Total Applications"
          value={stats.totalApps}
          icon={FileText}
          variant="primary"
          trend={`${stats.applied} In Review`}
        />
        <MetricCard
          compact
          title="Shortlisted Drives"
          value={stats.shortlisted}
          icon={Briefcase}
          variant="warning"
          trend="Advanced to rounds"
        />
        <MetricCard
          compact
          title="Upcoming Interviews"
          value={stats.upcomingInterviewsCount}
          icon={CalendarCheck}
          variant="info"
          trend={stats.nextInterview ? `Next: ${formatDate(stats.nextInterview.interviewDate)}` : 'No upcoming slots'}
        />
        <MetricCard
          compact
          title="Placement Outcome"
          value={stats.isPlaced ? 'Placed' : 'In Progress'}
          icon={Award}
          variant={stats.isPlaced ? 'success' : 'neutral'}
          trend={
            stats.activePlacement
              ? `${stats.activePlacement.company?.companyName || 'Corporate Offer'}`
              : `${stats.totalApps} submitted`
          }
        />
      </div>

      {/* 3. Placement Offer Status Callout - Minimalistic */}
      {stats.isPlaced && stats.activePlacement ? (
        <Card
          style={{
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            backgroundColor: 'rgba(16, 185, 129, 0.05)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <CardBody style={{ padding: '0.9rem 1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Award size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Official Placement Offer Verified
                    </span>
                    <CheckCircle size={14} style={{ color: '#10B981' }} />
                  </div>
                  <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                    Placed at {stats.activePlacement.company?.companyName}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <span>Role: <strong>{stats.activePlacement.job?.jobTitle || 'Graduate Trainee'}</strong></span>
                    <span>•</span>
                    <span>Package: <strong style={{ color: 'var(--color-text-primary)' }}>{formatSalary(stats.activePlacement.packageAmount)}</strong></span>
                    {stats.activePlacement.placementDate && (
                      <>
                        <span>•</span>
                        <span>Offer Date: {formatDate(stats.activePlacement.placementDate)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link to="/my-placement" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  View Full Offer Details
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-xs)' }}>
          <CardBody style={{ padding: '0.9rem 1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.15rem 0', fontSize: '1rem', fontWeight: 700 }}>
                    Campus Recruitment Drive In Progress
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                    {applications.length > 0
                      ? `You have ${applications.length} active application(s) under review. Keep track of shortlist announcements and interview calls.`
                      : 'You have not submitted any applications yet. Explore verified corporate recruitment drives and apply now!'}
                  </p>
                </div>
              </div>

              <Link to="/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  Browse Active Job Drives
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 4. Two-Column Dashboard Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: Recent Applications */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>My Applications</h3>
              </div>
              <Link to="/my-applications" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  View All ({applications.length})
                  <ArrowRight size={13} />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {/* Status Breakdown Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-info, #3B82F6)' }}>{stats.applied}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Applied</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-warning, #F59E0B)' }}>{stats.shortlisted}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Shortlisted</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success, #10B981)' }}>{stats.selected}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Selected</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger, #EF4444)' }}>{stats.rejected}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rejected</div>
              </div>
            </div>

            {applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Applications Yet"
                description="Explore current campus job openings and submit your first application."
                action={
                  <Link to="/jobs">
                    <Button variant="primary" size="sm">Browse Jobs</Button>
                  </Link>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {applications.slice(0, 4).map((app) => (
                  <div
                    key={app.applicationId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                        {app.job?.jobTitle || 'Job Opening'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={13} />
                        <span>{app.job?.company?.companyName || 'Company'}</span>
                        <span>•</span>
                        <span>{formatDate(app.applicationDate)}</span>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column: Upcoming & Recent Interviews */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CalendarCheck size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>My Interviews</h3>
              </div>
              <Link to="/my-interviews" style={{ textDecoration: 'none' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  View All ({interviews.length})
                  <ArrowRight size={13} />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            {/* Next Interview Highlight (if any) */}
            {stats.nextInterview && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-info, #3B82F6)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Clock size={14} />
                  <span>Next Scheduled Round</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  Round {stats.nextInterview.roundNumber}: {stats.nextInterview.roundType} Interview
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  {stats.nextInterview.application?.job?.company?.companyName} • {formatDate(stats.nextInterview.interviewDate)}
                </div>
              </div>
            )}

            {interviews.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No Interviews Scheduled"
                description="Once partner companies evaluate and shortlist your applications, your interview schedules will appear here."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {interviews.slice(0, 4).map((interview) => (
                  <div
                    key={interview.interviewId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                        Round {interview.roundNumber}: {interview.roundType}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{interview.application?.job?.company?.companyName || 'Corporate Partner'}</span>
                        <span>•</span>
                        <Calendar size={13} />
                        <span>{formatDate(interview.interviewDate)}</span>
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={interview.result || 'Pending'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 5. Portal Quick Navigation Actions */}
      <Card>
        <CardBody>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Quick Navigation Shortcuts:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link to="/my-applications" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <FileText size={15} />
                  My Applications
                </Button>
              </Link>
              <Link to="/my-interviews" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <CalendarCheck size={15} />
                  My Interviews
                </Button>
              </Link>
              <Link to="/my-placement" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <Award size={15} />
                  My Placement
                </Button>
              </Link>
              <Link to="/my-profile" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm">
                  <User size={15} />
                  My Profile
                </Button>
              </Link>
              <Link to="/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm">
                  <Briefcase size={15} />
                  Explore Jobs
                </Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default StudentDashboardPage;
