import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck,
  Award,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle,
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
  Legend,
} from 'recharts';

import { studentsApi } from '../api/students';
import { companiesApi } from '../api/companies';
import { jobsApi } from '../api/jobs';
import { applicationsApi } from '../api/applications';
import { interviewsApi } from '../api/interviews';
import { placementsApi } from '../api/placements';
import { departmentsApi } from '../api/departments';

import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import { SkeletonMetricsGrid, SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate, formatSalary } from '../utils/formatters';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_COLORS = {
  APPLIED: '#3B82F6',
  SHORTLISTED: '#F59E0B',
  SELECTED: '#10B981',
  REJECTED: '#EF4444',
};

const CHART_PALETTE = ['#3B5BDB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export function DashboardPage() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const applicationStatusData = React.useMemo(() => {
    if (!data.applications.length) return [];
    const counts = {};
    data.applications.forEach((app) => {
      const st = app.status ? app.status.toUpperCase() : 'APPLIED';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      color: STATUS_COLORS[name] || '#64748B',
    }));
  }, [data.applications]);

  const departmentDistribution = React.useMemo(() => {
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
      .map((d) => ({
        ...d,
        shortName: d.name.length > 15 ? d.name.substring(0, 15) + '…' : d.name,
      }));
  }, [data.departments, data.students]);

  const recentApplications = React.useMemo(() => {
    return [...data.applications]
      .sort((a, b) => (b.applicationId || 0) - (a.applicationId || 0))
      .slice(0, 5);
  }, [data.applications]);

  const recentInterviews = React.useMemo(() => {
    return [...data.interviews]
      .sort((a, b) => (b.interviewId || 0) - (a.interviewId || 0))
      .slice(0, 5);
  }, [data.interviews]);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Placement Operations Overview
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Real-time university placement activity and recruitment metrics.
          </p>
        </div>
        <SkeletonMetricsGrid count={7} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <SkeletonTable rows={4} cols={3} />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
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
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
            Placement Operations Overview
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Live metrics, application progress, and university recruitment analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/jobs">
            <Button variant="primary" icon={Plus}>
              Browse & Apply Jobs
            </Button>
          </Link>
          <Link to="/statistics">
            <Button variant="secondary" icon={TrendingUp}>
              View Statistics
            </Button>
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <MetricCard
          title="Total Students"
          value={metrics.totalStudents}
          icon={GraduationCap}
          variant="info"
          subtitle="Enrolled cohort"
        />
        <MetricCard
          title="Companies"
          value={metrics.registeredCompanies}
          icon={Building2}
          variant="default"
          subtitle="Corporate partners"
        />
        <MetricCard
          title="Available Jobs"
          value={metrics.availableJobs}
          icon={Briefcase}
          variant="default"
          subtitle="Open postings"
        />
        <MetricCard
          title="Applications"
          value={metrics.totalApplications}
          icon={FileText}
          variant="info"
          subtitle="Total submissions"
        />
        <MetricCard
          title="Interviews"
          value={metrics.scheduledInterviews}
          icon={CalendarCheck}
          variant="warning"
          subtitle="Rounds scheduled"
        />
        <MetricCard
          title="Placements"
          value={metrics.successfulPlacements}
          icon={Award}
          variant="success"
          subtitle="Verified offers"
        />
        <MetricCard
          title="Placement Rate"
          value={`${metrics.placementPercentage}%`}
          icon={TrendingUp}
          variant="success"
          trend="Overall rate"
          subtitle="Of total students"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '1.5rem',
        }}
      >
        
        <Card>
          <CardHeader
            title="Applications by Status"
            subtitle="Current progression across hiring pipelines"
          />
          <CardBody>
            {applicationStatusData.length === 0 ? (
              <EmptyState
                title="No Applications Recorded"
                description="Applications will appear here once students apply to jobs."
              />
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationStatusData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? '#A5B4C7' : '#667085'}
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#A5B4C7' : '#667085'}
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#151F32' : '#FFFFFF',
                        borderColor: isDark ? '#2A3850' : '#E4E8F0',
                        borderRadius: '8px',
                        color: isDark ? '#F1F5F9' : '#172033',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Students by Department"
            subtitle="Academic departmental representation"
          />
          <CardBody>
            {departmentDistribution.length === 0 ? (
              <EmptyState
                title="No Department Data"
                description="Department student counts will be visualized once departments and students are present."
              />
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {departmentDistribution.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#151F32' : '#FFFFFF',
                        borderColor: isDark ? '#2A3850' : '#E4E8F0',
                        borderRadius: '8px',
                        color: isDark ? '#F1F5F9' : '#172033',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Legend
                      formatter={(val) => (
                        <span style={{ color: isDark ? '#A5B4C7' : '#667085', fontSize: '0.75rem' }}>
                          {val}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem',
        }}
      >
        
        <Card>
          <CardHeader
            title="Recent Applications"
            subtitle="Latest candidate job submissions"
            action={
              <Link to="/applications" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            {recentApplications.length === 0 ? (
              <EmptyState
                title="No Recent Applications"
                description="No application records found."
              />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Role & Company</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app.applicationId}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {app.student?.name || `Student #${app.student?.studentId}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          ID: {app.student?.studentId}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {app.job?.jobTitle || `Job #${app.job?.jobId}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {app.job?.company?.companyName}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        {formatDate(app.applicationDate)}
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Interview Schedules"
            subtitle="Upcoming candidate assessments and rounds"
            action={
              <Link to="/interviews" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                View all <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            {recentInterviews.length === 0 ? (
              <EmptyState
                title="No Interviews Scheduled"
                description="No interview round records found."
              />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Candidate</th>
                    <th>Date</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInterviews.map((item) => (
                    <tr key={item.interviewId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          Round {item.roundNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.roundType || 'General'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {item.application?.student?.name || `App #${item.application?.applicationId}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.application?.job?.jobTitle}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        {formatDate(item.interviewDate)}
                      </td>
                      <td>
                        <StatusBadge status={item.result} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Quick Actions & Operations"
          subtitle="Frequently executed placement office workflows"
        />
        <CardBody>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <Link to="/jobs" style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
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
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                    Apply for Job
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Trigger stored procedure check
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/students" style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-info-bg)',
                    color: 'var(--color-info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                    Students Directory
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Manage profiles & CGPA
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/placements" style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Award size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                    Record Placement
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Auto-updates student status
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/statistics" style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-warning-bg)',
                    color: 'var(--color-warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                    Department Stats
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Department-wise placement %
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default DashboardPage;
