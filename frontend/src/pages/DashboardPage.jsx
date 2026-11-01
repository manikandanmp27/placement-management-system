import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ClipboardList,
  FileText,
  CalendarClock,
  Award,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { studentsApi } from '../api/students';
import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
import { applicationsApi } from '../api/applications';
import { interviewsApi } from '../api/interviews';
import { placementsApi } from '../api/placements';
import { departmentsApi } from '../api/departments';

import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid, SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboardPage from './StudentDashboardPage';

export function DashboardPage() {
  const { isStudent } = useAuth();

  if (isStudent) {
    return <StudentDashboardPage />;
  }

  return <OfficerDashboardContent />;
}

function OfficerDashboardContent() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    registeredCompanies: 0,
    availableJobs: 0,
    totalApplications: 0,
    scheduledInterviews: 0,
    successfulPlacements: 0,
    placementPercentage: 0,
  });

  const [data, setData] = useState({
    students: [],
    companies: [],
    jobs: [],
    applications: [],
    interviews: [],
    placements: [],
    departments: [],
  });

  const loadDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [
        studentsRes,
        companiesRes,
        jobsRes,
        applicationsRes,
        interviewsRes,
        placementsRes,
        departmentsRes,
      ] = await Promise.all([
        studentsApi.getAll().catch(() => []),
        companiesApi.getAll().catch(() => []),
        jobsApi.getAll().catch(() => []),
        applicationsApi.getAll().catch(() => []),
        interviewsApi.getAll().catch(() => []),
        placementsApi.getAll().catch(() => []),
        departmentsApi.getAll().catch(() => []),
      ]);

      const students = Array.isArray(studentsRes) ? studentsRes : [];
      const companies = Array.isArray(companiesRes) ? companiesRes : [];
      const jobs = Array.isArray(jobsRes) ? jobsRes : [];
      const applications = Array.isArray(applicationsRes) ? applicationsRes : [];
      const interviews = Array.isArray(interviewsRes) ? interviewsRes : [];
      const placements = Array.isArray(placementsRes) ? placementsRes : [];
      const departments = Array.isArray(departmentsRes) ? departmentsRes : [];

      const totalStudents = students.length;
      const successfulPlacements = placements.length;
      const placementPercentage =
        totalStudents > 0
          ? ((successfulPlacements / totalStudents) * 100).toFixed(1)
          : 0;

      setMetrics({
        totalStudents,
        registeredCompanies: companies.length,
        availableJobs: jobs.length,
        totalApplications: applications.length,
        scheduledInterviews: interviews.length,
        successfulPlacements,
        placementPercentage,
      });

      setData({
        students,
        companies,
        jobs,
        applications,
        interviews,
        placements,
        departments,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to load placement operations data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Read CSS variables for Recharts so charts adapt to theme
  const chartColors = useMemo(() => {
    return {
      applied: isDark ? '#C79A73' : '#8A532B',
      shortlisted: isDark ? '#E5A93C' : '#D97706',
      selected: isDark ? '#34D399' : '#10B981',
      rejected: isDark ? '#F87171' : '#EF4444',
      primary: isDark ? '#D28C57' : '#743F1D',
      grid: isDark ? '#2D221B' : '#E6DED6',
      text: isDark ? '#D5C7B8' : '#5A4638',
      tooltipBg: isDark ? '#201712' : '#FFFFFF',
      tooltipBorder: isDark ? '#3D2D22' : '#DFD5C6',
    };
  }, [isDark]);

  // Applications Donut Breakdown
  const applicationStatusData = useMemo(() => {
    if (!data.applications.length) return [];
    const counts = { APPLIED: 0, SHORTLISTED: 0, SELECTED: 0, REJECTED: 0 };
    data.applications.forEach((app) => {
      const st = (app.status || 'APPLIED').toUpperCase();
      if (counts[st] !== undefined) counts[st] += 1;
      else counts.APPLIED += 1;
    });

    const total = data.applications.length;
    return [
      { name: 'Applied', key: 'APPLIED', count: counts.APPLIED, color: chartColors.applied, pct: total ? Math.round((counts.APPLIED / total) * 100) : 0 },
      { name: 'Shortlisted', key: 'SHORTLISTED', count: counts.SHORTLISTED, color: chartColors.shortlisted, pct: total ? Math.round((counts.SHORTLISTED / total) * 100) : 0 },
      { name: 'Selected', key: 'SELECTED', count: counts.SELECTED, color: chartColors.selected, pct: total ? Math.round((counts.SELECTED / total) * 100) : 0 },
      { name: 'Rejected', key: 'REJECTED', count: counts.REJECTED, color: chartColors.rejected, pct: total ? Math.round((counts.REJECTED / total) * 100) : 0 },
    ].filter((item) => item.count > 0);
  }, [data.applications, chartColors]);

  // Students by Department Horizontal Bars
  const departmentDistribution = useMemo(() => {
    if (!data.departments.length || !data.students.length) return [];
    const map = {};
    data.departments.forEach((d) => {
      map[d.departmentId] = { name: d.departmentName, count: 0 };
    });
    data.students.forEach((s) => {
      const deptId = s.department?.departmentId;
      if (deptId && map[deptId]) {
        map[deptId].count += 1;
      }
    });
    return Object.values(map)
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [data.departments, data.students]);

  // Recent operational items
  const recentApplications = useMemo(() => {
    return [...data.applications]
      .sort((a, b) => (b.applicationId || 0) - (a.applicationId || 0))
      .slice(0, 5);
  }, [data.applications]);

  const recentInterviews = useMemo(() => {
    return [...data.interviews]
      .sort((a, b) => (b.interviewId || 0) - (a.interviewId || 0))
      .slice(0, 5);
  }, [data.interviews]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '36px', width: '280px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonMetricsGrid count={7} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
          <SkeletonTable rows={4} cols={3} />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Couldn't load dashboard" message={error} onRetry={() => loadDashboardData(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">Placement Operations Dashboard</h1>
          <p className="page-header-subtitle">
            Recruitment pipeline overview, active drives, and department metrics
          </p>
        </div>

        <div className="page-header-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadDashboardData(true)}
            isLoading={isRefreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. KPI Strip (Quiet Ledger 4+3 Grid with Placement Rate Lead Card) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Placement Rate Lead Card (Spans 2 columns on larger screens) */}
        <Link to="/placements" style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
          <div className="metric-card lead card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Placement Rate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap success" aria-hidden="true">
                  <TrendingUp size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div className="metric-card-value">
              {metrics.placementPercentage}%
            </div>

            {/* Success Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-surface-active)',
                overflow: 'hidden',
                margin: '4px 0',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, metrics.placementPercentage)}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-success)',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>

            <div className="metric-card-meta">
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {metrics.successfulPlacements} of {metrics.totalStudents} eligible students placed
              </span>
            </div>
          </div>
        </Link>

        {/* Total Students */}
        <Link to="/students" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Students</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap" aria-hidden="true">
                  <Users size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.totalStudents}</div>
            <div className="metric-card-meta"><span>Enrolled roster cohort</span></div>
          </div>
        </Link>

        {/* Corporate Partners */}
        <Link to="/companies" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Companies</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap" aria-hidden="true">
                  <Building2 size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.registeredCompanies}</div>
            <div className="metric-card-meta"><span>Active hiring partners</span></div>
          </div>
        </Link>

        {/* Available Jobs */}
        <Link to="/jobs" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Jobs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap" aria-hidden="true">
                  <ClipboardList size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.availableJobs}</div>
            <div className="metric-card-meta"><span>Active recruitment drives</span></div>
          </div>
        </Link>

        {/* Applications */}
        <Link to="/applications" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Applications</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap info" aria-hidden="true">
                  <FileText size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.totalApplications}</div>
            <div className="metric-card-meta"><span>Candidate submissions</span></div>
          </div>
        </Link>

        {/* Interviews */}
        <Link to="/interviews" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Interviews</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap warning" aria-hidden="true">
                  <CalendarClock size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.scheduledInterviews}</div>
            <div className="metric-card-meta"><span>Evaluation rounds scheduled</span></div>
          </div>
        </Link>

        {/* Placements */}
        <Link to="/placements" style={{ textDecoration: 'none' }}>
          <div className="metric-card card-interactive" style={{ height: '100%' }}>
            <div className="metric-card-top">
              <span className="metric-card-label">Offers</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div className="metric-card-icon-wrap success" aria-hidden="true">
                  <Award size={18} strokeWidth={1.75} />
                </div>
                <ArrowUpRight size={14} strokeWidth={1.75} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
            <div className="metric-card-value">{metrics.successfulPlacements}</div>
            <div className="metric-card-meta"><span>Recorded placement offers</span></div>
          </div>
        </Link>
      </div>

      {/* 2. Charts Row (Two-Up Layout) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Application Status Donut with Legible Legend Table */}
        <Card>
          <CardHeader
            title="Applications by Status"
            subtitle="Current candidate distribution in the pipeline"
          />
          <CardBody>
            {applicationStatusData.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No applications recorded"
                description="Status metrics will calculate as candidates apply to recruitment drives."
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                {/* Donut Chart */}
                <div style={{ width: 180, height: 200, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {applicationStatusData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '8px',
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          boxShadow: 'var(--shadow-3)',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Table (Labels, counts, and percentages) */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <table className="table" style={{ fontSize: 'var(--text-xs)' }}>
                    <tbody>
                      {applicationStatusData.map((item) => (
                        <tr key={item.key} style={{ height: '32px' }}>
                          <td style={{ padding: '6px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </div>
                          </td>
                          <td className="col-numeric" style={{ padding: '6px 8px', fontWeight: 600 }}>
                            {item.count}
                          </td>
                          <td className="col-numeric" style={{ padding: '6px 8px', color: 'var(--color-text-muted)' }}>
                            {item.pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Students by Department Horizontal Bar Chart */}
        <Card>
          <CardHeader
            title="Students by Department"
            subtitle="Academic cohort representation in placement directory"
          />
          <CardBody>
            {departmentDistribution.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No department cohort data"
                description="Department student distribution will appear when records are loaded."
              />
            ) : (
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" stroke={chartColors.text} fontSize={12} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke={chartColors.text}
                      fontSize={11}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        borderRadius: '8px',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        boxShadow: 'var(--shadow-3)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 3. Recent Activity Row (Two-Up Tables) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Recent Applications */}
        <Card>
          <CardHeader
            title="Recent Applications"
            subtitle="Latest candidate drive submissions"
            action={
              <Link to="/applications" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  <span>View all</span>
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {recentApplications.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                No recent applications recorded.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidate & Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr key={app.applicationId}>
                        <td>
                          <div className="cell-primary">
                            <span className="cell-title">{app.student?.name || `Student #${app.studentId}`}</span>
                            <span className="cell-subtitle">
                              {app.job?.jobTitle || `Job #${app.jobId}`} • {app.job?.company?.companyName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {formatDate(app.applicationDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader
            title="Upcoming Interviews"
            subtitle="Next scheduled assessment rounds"
            action={
              <Link to="/interviews" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  <span>View all</span>
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            }
          />
          <CardBody style={{ padding: 0 }}>
            {recentInterviews.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                No upcoming interviews scheduled.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Candidate & Role</th>
                      <th>Round</th>
                      <th style={{ textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInterviews.map((intv) => (
                      <tr key={intv.interviewId}>
                        <td>
                          <div className="cell-primary">
                            <span className="cell-title">{intv.application?.student?.name || 'Candidate'}</span>
                            <span className="cell-subtitle">
                              {intv.application?.job?.jobTitle || 'Role'} • {intv.application?.job?.company?.companyName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <CategoryTag>{intv.roundType || `Round ${intv.roundNumber}`}</CategoryTag>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--text-xs)' }}>
                          {formatDate(intv.interviewDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
