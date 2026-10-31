import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileBarChart,
  UserX,
  Briefcase,
  CalendarCheck,
  Search,
  RefreshCw,
  Download,
  Building,
  GraduationCap,
  Award,
  Clock,
  ArrowUpDown,
  Building2,
  CheckCircle2,
} from 'lucide-react';

import { reportsApi } from '../api/reports';
import { useToast } from '../contexts/ToastContext';

import MetricCard from '../components/common/MetricCard';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable, SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';

function formatLPA(val) {
  if (val === null || val === undefined) return '—';
  const num = Number(val);
  return isNaN(num) ? '—' : `₹${num.toFixed(1)} LPA`;
}

export function ReportsPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('unapplied'); // 'unapplied' | 'jobs' | 'interviewing'

  // Summary state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Tab 1: Unapplied students
  const [unappliedStudents, setUnappliedStudents] = useState([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loadingUnapplied, setLoadingUnapplied] = useState(false);
  const [unappliedSearch, setUnappliedSearch] = useState('');
  const [unappliedSort, setUnappliedSort] = useState('id-asc');

  // Tab 2: Jobs ranked by applicant count
  const [jobsRanked, setJobsRanked] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsSort, setJobsSort] = useState('applicants-desc');

  // Tab 3: Students in interview process
  const [interviewStudents, setInterviewStudents] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [interviewSearch, setInterviewSearch] = useState('');
  const [interviewStageFilter, setInterviewStageFilter] = useState('ALL');

  const [error, setError] = useState(null);

  // Load summary metrics
  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const data = await reportsApi.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load reports summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Load Tab 1 data
  const loadUnappliedStudents = useCallback(async (withArchived) => {
    try {
      setLoadingUnapplied(true);
      setError(null);
      const data = await reportsApi.getUnappliedStudents(withArchived);
      setUnappliedStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load unapplied students report:', err);
      setError(err.message || 'Failed to fetch unapplied students report.');
      toast.error('Unable to load unapplied students report.');
    } finally {
      setLoadingUnapplied(false);
    }
  }, [toast]);

  // Load Tab 2 data
  const loadJobsRanked = useCallback(async () => {
    try {
      setLoadingJobs(true);
      setError(null);
      const data = await reportsApi.getJobsByApplicants();
      setJobsRanked(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load jobs ranking report:', err);
      setError(err.message || 'Failed to fetch job applicant rankings.');
      toast.error('Unable to load job rankings report.');
    } finally {
      setLoadingJobs(false);
    }
  }, [toast]);

  // Load Tab 3 data
  const loadInterviewStudents = useCallback(async () => {
    try {
      setLoadingInterviews(true);
      setError(null);
      const data = await reportsApi.getStudentsInInterviewProcess();
      setInterviewStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load students in interview process report:', err);
      setError(err.message || 'Failed to fetch interview process report.');
      toast.error('Unable to load interview pipeline report.');
    } finally {
      setLoadingInterviews(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadSummary();
    loadUnappliedStudents(includeArchived);
    loadJobsRanked();
    loadInterviewStudents();
  }, [loadSummary, loadUnappliedStudents, loadJobsRanked, loadInterviewStudents, includeArchived]);

  const handleRefreshAll = () => {
    loadSummary();
    if (activeTab === 'unapplied') loadUnappliedStudents(includeArchived);
    if (activeTab === 'jobs') loadJobsRanked();
    if (activeTab === 'interviewing') loadInterviewStudents();
    toast.success('Reports updated with latest database records.');
  };

  // Filtered & Sorted Tab 1: Unapplied students
  const filteredUnapplied = useMemo(() => {
    let result = unappliedStudents.filter((s) => {
      const q = unappliedSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        String(s.studentId).includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.departmentName && s.departmentName.toLowerCase().includes(q))
      );
    });

    result.sort((a, b) => {
      switch (unappliedSort) {
        case 'cgpa-desc':
          return (b.cgpa || 0) - (a.cgpa || 0);
        case 'cgpa-asc':
          return (a.cgpa || 0) - (b.cgpa || 0);
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'id-desc':
          return b.studentId - a.studentId;
        case 'id-asc':
        default:
          return a.studentId - b.studentId;
      }
    });

    return result;
  }, [unappliedStudents, unappliedSearch, unappliedSort]);

  // Filtered & Sorted Tab 2: Jobs ranked
  const filteredJobs = useMemo(() => {
    let result = jobsRanked.filter((j) => {
      const q = jobsSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        (j.jobTitle && j.jobTitle.toLowerCase().includes(q)) ||
        (j.companyName && j.companyName.toLowerCase().includes(q)) ||
        (j.jobType && j.jobType.toLowerCase().includes(q)) ||
        String(j.jobId).includes(q)
      );
    });

    result.sort((a, b) => {
      switch (jobsSort) {
        case 'package-desc':
          return (b.packageAmount || 0) - (a.packageAmount || 0);
        case 'deadline-asc':
          return new Date(a.deadline || 0) - new Date(b.deadline || 0);
        case 'title-asc':
          return (a.jobTitle || '').localeCompare(b.jobTitle || '');
        case 'applicants-asc':
          return (a.applicantCount || 0) - (b.applicantCount || 0);
        case 'applicants-desc':
        default:
          return (b.applicantCount || 0) - (a.applicantCount || 0);
      }
    });

    return result;
  }, [jobsRanked, jobsSearch, jobsSort]);

  // Filtered Tab 3: Students in interview process
  const filteredInterviews = useMemo(() => {
    return interviewStudents.filter((row) => {
      const q = interviewSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (row.studentName && row.studentName.toLowerCase().includes(q)) ||
        (row.jobTitle && row.jobTitle.toLowerCase().includes(q)) ||
        (row.companyName && row.companyName.toLowerCase().includes(q)) ||
        (row.departmentName && row.departmentName.toLowerCase().includes(q)) ||
        (row.roundType && row.roundType.toLowerCase().includes(q)) ||
        String(row.studentId).includes(q);

      if (!matchesSearch) return false;

      if (interviewStageFilter === 'PENDING_ROUND') {
        return row.interviewResult && row.interviewResult.toLowerCase() === 'pending';
      }
      if (interviewStageFilter === 'AWAITING_SCHEDULE') {
        return !row.interviewId;
      }

      return true;
    });
  }, [interviewStudents, interviewSearch, interviewStageFilter]);

  // Export current tab to CSV
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `placement_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'unapplied') {
      headers = ['Student ID', 'Name', 'Email', 'Department', 'CGPA', 'Backlogs', 'Placement Status', 'Archived'];
      rows = filteredUnapplied.map((s) => [
        s.studentId,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.departmentName || '').replace(/"/g, '""')}"`,
        s.cgpa || '',
        s.backlogs ?? '',
        s.placementStatus || '',
        s.isArchived ? 'Yes' : 'No',
      ]);
    } else if (activeTab === 'jobs') {
      headers = ['Rank', 'Job ID', 'Job Title', 'Company', 'Job Type', 'Package (LPA)', 'Deadline', 'Min CGPA', 'Max Backlogs', 'Applicants Count'];
      rows = filteredJobs.map((j, idx) => [
        idx + 1,
        j.jobId,
        `"${(j.jobTitle || '').replace(/"/g, '""')}"`,
        `"${(j.companyName || '').replace(/"/g, '""')}"`,
        `"${(j.jobType || '').replace(/"/g, '""')}"`,
        j.packageAmount || '',
        j.deadline || '',
        j.minCgpa || '',
        j.maxBacklogs ?? '',
        j.applicantCount ?? 0,
      ]);
    } else if (activeTab === 'interviewing') {
      headers = ['Student ID', 'Student Name', 'Department', 'Job Title', 'Company', 'Application Status', 'Round Number', 'Round Type', 'Interview Date', 'Result'];
      rows = filteredInterviews.map((r) => [
        r.studentId,
        `"${(r.studentName || '').replace(/"/g, '""')}"`,
        `"${(r.departmentName || '').replace(/"/g, '""')}"`,
        `"${(r.jobTitle || '').replace(/"/g, '""')}"`,
        `"${(r.companyName || '').replace(/"/g, '""')}"`,
        r.applicationStatus || '',
        r.roundNumber ?? '',
        `"${(r.roundType || 'Awaiting Scheduling').replace(/"/g, '""')}"`,
        r.interviewDate || '',
        r.interviewResult || 'Pending Schedule',
      ]);
    }

    if (rows.length === 0) {
      toast.error('No rows available to export.');
      return;
    }

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${rows.length} record(s) to ${filename}`);
  };

  return (
    <div className="page-container">
      {/* Top Header / Action Bar */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FileBarChart size={24} style={{ color: 'var(--color-primary)' }} />
            <h1 className="page-title" style={{ margin: 0 }}>Placement Reports & Pipeline Analytics</h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Official university placement reports covering candidate engagement, applicant demand, and active interview progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={RefreshCw} onClick={handleRefreshAll}>
            Refresh Reports
          </Button>
          <Button variant="primary" icon={Download} onClick={handleExportCSV}>
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      {loadingSummary && !summary ? (
        <SkeletonMetricsGrid count={4} />
      ) : (
        <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
          <MetricCard
            title="Unapplied Students"
            value={summary ? summary.unappliedStudentsCount : '—'}
            subtitle="Registered candidates with 0 submissions"
            icon={UserX}
            variant={summary && summary.unappliedStudentsCount > 0 ? 'warning' : 'success'}
          />
          <MetricCard
            title="Active Interview Pipeline"
            value={summary ? summary.activeInterviewPipelineCount : '—'}
            subtitle="Candidates in shortlisting or pending rounds"
            icon={CalendarCheck}
            variant="primary"
          />
          <MetricCard
            title="Active Job Openings"
            value={summary ? summary.totalJobs : '—'}
            subtitle="Recruitment drives published on portal"
            icon={Briefcase}
            variant="default"
          />
          <MetricCard
            title="Total Applications"
            value={summary ? summary.totalApplications : '—'}
            subtitle="Drive submissions across all companies"
            icon={Award}
            variant="default"
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('unapplied')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'unapplied' ? 'var(--color-bg-surface)' : 'transparent',
            color: activeTab === 'unapplied' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'unapplied' ? '2px solid var(--color-primary)' : '2px solid transparent',
            transition: 'all var(--transition-fast)',
          }}
        >
          <UserX size={16} />
          <span>Students with No Applications</span>
          <span
            className="badge badge-warning"
            style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
          >
            {unappliedStudents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'jobs' ? 'var(--color-bg-surface)' : 'transparent',
            color: activeTab === 'jobs' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'jobs' ? '2px solid var(--color-primary)' : '2px solid transparent',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Briefcase size={16} />
          <span>Jobs Ranked by Applicants</span>
          <span
            className="badge badge-info"
            style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
          >
            {jobsRanked.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interviewing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'interviewing' ? 'var(--color-bg-surface)' : 'transparent',
            color: activeTab === 'interviewing' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === 'interviewing' ? '2px solid var(--color-primary)' : '2px solid transparent',
            transition: 'all var(--transition-fast)',
          }}
        >
          <CalendarCheck size={16} />
          <span>Students in Interview Process</span>
          <span
            className="badge badge-success"
            style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}
          >
            {interviewStudents.length}
          </span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ErrorState message={error} onRetry={handleRefreshAll} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: Students with No Applications                                      */}
      {/* ========================================================================= */}
      {activeTab === 'unapplied' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Unapplied Student Roster</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Candidates who have not yet submitted an application to any campus recruitment drive.
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ minWidth: '220px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search name, ID, dept..."
                    value={unappliedSearch}
                    onChange={(e) => setUnappliedSearch(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowUpDown size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <select
                    className="form-control form-control-sm"
                    value={unappliedSort}
                    onChange={(e) => setUnappliedSort(e.target.value)}
                    style={{ minWidth: '140px' }}
                  >
                    <option value="id-asc">Sort: Student ID (Asc)</option>
                    <option value="id-desc">Sort: Student ID (Desc)</option>
                    <option value="cgpa-desc">Sort: Highest CGPA</option>
                    <option value="cgpa-asc">Sort: Lowest CGPA</option>
                    <option value="name-asc">Sort: Name (A–Z)</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                  />
                  <span>Include Archived</span>
                </label>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {loadingUnapplied ? (
              <div style={{ padding: '1.5rem' }}>
                <SkeletonTable rows={5} columns={6} />
              </div>
            ) : filteredUnapplied.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="100% Student Engagement!"
                description={
                  unappliedSearch
                    ? 'No unapplied students match your search criteria.'
                    : 'Every student in the roster has applied to at least one recruitment drive.'
                }
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>ID</th>
                      <th>Candidate Details</th>
                      <th>Department</th>
                      <th style={{ width: '90px' }}>CGPA</th>
                      <th style={{ width: '90px' }}>Backlogs</th>
                      <th style={{ width: '140px' }}>Status</th>
                      <th style={{ width: '120px' }}>Roster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnapplied.map((student) => (
                      <tr key={student.studentId}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{student.studentId}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {student.email}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{student.departmentName || '—'}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{student.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}</span>
                        </td>
                        <td>
                          <span
                            className={student.backlogs > 0 ? 'badge badge-danger' : 'badge badge-secondary'}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {student.backlogs ?? 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              student.placementStatus === 'PLACED'
                                ? 'badge badge-success'
                                : 'badge badge-secondary'
                            }
                            style={{ fontSize: '0.75rem' }}
                          >
                            {student.placementStatus || 'NOT_PLACED'}
                          </span>
                        </td>
                        <td>
                          {student.isArchived ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                              Archived
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Jobs Ranked by Applicant Count                                     */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Recruitment Demand Rankings</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Active job openings ordered by applicant submission volume (highest demand to lowest).
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ minWidth: '220px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search title, company, type..."
                    value={jobsSearch}
                    onChange={(e) => setJobsSearch(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowUpDown size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <select
                    className="form-control form-control-sm"
                    value={jobsSort}
                    onChange={(e) => setJobsSort(e.target.value)}
                    style={{ minWidth: '170px' }}
                  >
                    <option value="applicants-desc">Sort: Applicants (Highest)</option>
                    <option value="applicants-asc">Sort: Applicants (Lowest)</option>
                    <option value="package-desc">Sort: Package (Highest)</option>
                    <option value="deadline-asc">Sort: Deadline (Earliest)</option>
                    <option value="title-asc">Sort: Job Title (A–Z)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {loadingJobs ? (
              <div style={{ padding: '1.5rem' }}>
                <SkeletonTable rows={5} columns={6} />
              </div>
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No Job Postings Found"
                description={
                  jobsSearch
                    ? 'No job openings match your search filter.'
                    : 'No job listings have been created yet.'
                }
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Job Opportunity</th>
                      <th>Corporate Partner</th>
                      <th style={{ width: '130px' }}>Package</th>
                      <th style={{ width: '130px' }}>Deadline</th>
                      <th style={{ width: '150px' }}>Criteria</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Total Applicants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job, idx) => (
                      <tr key={job.jobId}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '26px',
                              height: '26px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-bg-subtle)',
                              color: idx === 0 ? '#b45309' : 'var(--color-text)',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{job.jobTitle}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {job.jobType || 'Full-Time'} • #{job.jobId}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building2 size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{job.companyName}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            {formatLPA(job.packageAmount)}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                            <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                            <span>{job.deadline || 'Ongoing'}</span>
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem' }}>Min CGPA: <strong>{job.minCgpa ?? '—'}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Max Backlogs: {job.maxBacklogs ?? 0}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={job.applicantCount > 0 ? 'badge badge-primary' : 'badge badge-secondary'}
                            style={{ fontSize: '0.8125rem', padding: '0.25rem 0.6rem', fontWeight: 700 }}
                          >
                            {job.applicantCount} {job.applicantCount === 1 ? 'applicant' : 'applicants'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Students in Interview Process                                      */}
      {/* ========================================================================= */}
      {activeTab === 'interviewing' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Active Interview Pipeline</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Candidates currently in active assessment rounds or shortlisted awaiting schedule.
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ minWidth: '220px' }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search candidate, company, role..."
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <select
                    className="form-control form-control-sm"
                    value={interviewStageFilter}
                    onChange={(e) => setInterviewStageFilter(e.target.value)}
                    style={{ minWidth: '160px' }}
                  >
                    <option value="ALL">All Pipeline Stages</option>
                    <option value="PENDING_ROUND">Pending Interview Rounds</option>
                    <option value="AWAITING_SCHEDULE">Shortlisted (Awaiting Round)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {loadingInterviews ? (
              <div style={{ padding: '1.5rem' }}>
                <SkeletonTable rows={5} columns={6} />
              </div>
            ) : filteredInterviews.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No Active Candidates in Pipeline"
                description={
                  interviewSearch || interviewStageFilter !== 'ALL'
                    ? 'No candidates match your pipeline filters.'
                    : 'There are currently no candidates in active interview or shortlisting stages.'
                }
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate Details</th>
                      <th>Department</th>
                      <th>Role & Company</th>
                      <th style={{ width: '140px' }}>App Status</th>
                      <th>Interview Round</th>
                      <th style={{ width: '120px' }}>Date</th>
                      <th style={{ width: '130px' }}>Outcome Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterviews.map((row, idx) => (
                      <tr key={`${row.applicationId}-${row.interviewId || 'unassigned'}-${idx}`}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            #{row.studentId} • {row.email}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <GraduationCap size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{row.departmentName}</span>
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.jobTitle}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {row.companyName}
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              row.applicationStatus === 'SHORTLISTED'
                                ? 'badge badge-primary'
                                : 'badge badge-info'
                            }
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            {row.applicationStatus}
                          </span>
                        </td>
                        <td>
                          {row.interviewId ? (
                            <div>
                              <span style={{ fontWeight: 600 }}>Round {row.roundNumber}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {row.roundType || 'General Round'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                              Awaiting Scheduling
                            </span>
                          )}
                        </td>
                        <td>
                          {row.interviewDate ? (
                            <span style={{ fontSize: '0.8125rem' }}>{row.interviewDate}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          {row.interviewResult ? (
                            <span
                              className={
                                row.interviewResult.toLowerCase() === 'pending'
                                  ? 'badge badge-warning'
                                  : 'badge badge-secondary'
                              }
                              style={{ fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              {row.interviewResult}
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                              Pending Schedule
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default ReportsPage;
