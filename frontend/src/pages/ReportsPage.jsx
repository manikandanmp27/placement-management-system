import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileBarChart,
  UserX,
  Briefcase,
  CalendarCheck,
  RefreshCw,
  Download,
  Building,
  GraduationCap,
  Award,
  Clock,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

import { reportsApi } from '../api/reports';
import { useToast } from '../contexts/ToastContext';

import MetricCard from '../components/common/MetricCard';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable, SkeletonMetricsGrid } from '../components/common/LoadingSkeleton';
import { formatSalary, formatDate } from '../utils/formatters';

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
  const [isExporting, setIsExporting] = useState(false);

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

  // Max applicant count for inline bar scaling
  const maxApplicants = useMemo(() => {
    return jobsRanked.reduce((max, j) => Math.max(max, j.applicantCount || 0), 1);
  }, [jobsRanked]);

  // Top in-demand job calculation
  const topJob = useMemo(() => {
    if (jobsRanked.length === 0) return null;
    return [...jobsRanked].sort((a, b) => (b.applicantCount || 0) - (a.applicantCount || 0))[0];
  }, [jobsRanked]);

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

  // Export active tab to CSV with >=300ms feedback
  const handleExportCSV = async () => {
    setIsExporting(true);

    try {
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
          s.cgpa != null ? Number(s.cgpa).toFixed(2) : '',
          s.backlogs ?? '',
          s.placementStatus || '',
          s.isArchived ? 'Yes' : 'No',
        ]);
      } else if (activeTab === 'jobs') {
        headers = ['Rank', 'Job ID', 'Job Title', 'Company', 'Job Type', 'Package (INR)', 'Deadline', 'Min CGPA', 'Max Backlogs', 'Applicants Count'];
        rows = filteredJobs.map((j, idx) => [
          idx + 1,
          j.jobId,
          `"${(j.jobTitle || '').replace(/"/g, '""')}"`,
          `"${(j.companyName || '').replace(/"/g, '""')}"`,
          `"${(j.jobType || '').replace(/"/g, '""')}"`,
          j.packageAmount || '',
          j.deadline || '',
          j.minCgpa ?? '',
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
        toast.warning('No records available to export in this view.');
        setIsExporting(false);
        return;
      }

      // Minimum 300ms spinner feedback per specification
      await new Promise((resolve) => setTimeout(resolve, 350));

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`CSV downloaded: ${filename}`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to generate CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const activeTabName = {
    unapplied: 'Unapplied Students',
    jobs: 'Job Demand Rankings',
    interviewing: 'Interview Pipeline',
  }[activeTab];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Comprehensive placement reporting: unapplied student roster, corporate demand rankings, and interview pipelines.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefreshAll}
            title="Refresh reports"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportCSV}
            isLoading={isExporting}
            id="btn-export-csv"
            title={`Export ${activeTabName} to CSV`}
          >
            Export CSV ({activeTabName})
          </Button>
        </div>
      </div>

      {/* Overview Strip (3 inline metrics) */}
      {loadingSummary && !summary ? (
        <SkeletonMetricsGrid count={3} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <MetricCard
            title="Total Unapplied"
            value={summary ? summary.unappliedStudentsCount : '—'}
            subtitle="Registered candidates with 0 drive submissions"
            icon={UserX}
            variant={summary && summary.unappliedStudentsCount > 0 ? 'warning' : 'success'}
          />
          <MetricCard
            title="Top In-Demand Job"
            value={topJob ? `${topJob.applicantCount} Applicants` : '—'}
            subtitle={topJob ? `${topJob.jobTitle} @ ${topJob.companyName}` : 'No active applications'}
            icon={Briefcase}
            variant="primary"
          />
          <MetricCard
            title="Candidates in Pipeline"
            value={summary ? summary.activeInterviewPipelineCount : '—'}
            subtitle="Candidates in shortlisting or pending rounds"
            icon={CalendarCheck}
            variant="default"
          />
        </div>
      )}

      {/* Underline Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto',
          marginTop: 'var(--space-2)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('unapplied')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'unapplied' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'unapplied' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <UserX size={16} />
          <span>Unapplied Students</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              backgroundColor: activeTab === 'unapplied' ? 'var(--color-primary-100)' : 'var(--color-surface-hover)',
              color: activeTab === 'unapplied' ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
            }}
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
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'jobs' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'jobs' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <Briefcase size={16} />
          <span>Jobs Ranked by Applicants</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              backgroundColor: activeTab === 'jobs' ? 'var(--color-primary-100)' : 'var(--color-surface-hover)',
              color: activeTab === 'jobs' ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
            }}
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
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'interviewing' ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'interviewing' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            marginBottom: '-1px',
            whiteSpace: 'nowrap',
            transition: 'all var(--duration-fast)',
          }}
        >
          <CalendarCheck size={16} />
          <span>Interview Pipeline</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              backgroundColor: activeTab === 'interviewing' ? 'var(--color-primary-100)' : 'var(--color-surface-hover)',
              color: activeTab === 'interviewing' ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
            }}
          >
            {interviewStudents.length}
          </span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <ErrorState message={error} onRetry={handleRefreshAll} />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: Unapplied Students                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'unapplied' && (
        <div className="card">
          {/* Tab Toolbar */}
          <div
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', flex: 1 }}>
              <div style={{ minWidth: '220px', maxWidth: '360px', flex: 1 }}>
                <SearchInput
                  placeholder="Search name, ID, department..."
                  value={unappliedSearch}
                  onChange={setUnappliedSearch}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  value={unappliedSort}
                  onChange={(e) => setUnappliedSort(e.target.value)}
                  aria-label="Sort unapplied students"
                >
                  <option value="id-asc">Student ID (Ascending)</option>
                  <option value="id-desc">Student ID (Descending)</option>
                  <option value="cgpa-desc">Highest CGPA</option>
                  <option value="cgpa-asc">Lowest CGPA</option>
                  <option value="name-asc">Student Name (A–Z)</option>
                </select>
              </div>

              {/* Include Archived Real Toggle Switch (role="switch") */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  role="switch"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  style={{
                    width: 32,
                    height: 18,
                    cursor: 'pointer',
                    accentColor: 'var(--color-primary-600)',
                  }}
                />
                <span>Include Archived</span>
              </label>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredUnapplied.length}</strong> unapplied
            </div>
          </div>

          {/* Table Content */}
          {loadingUnapplied ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filteredUnapplied.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Every active student has applied!"
              description={
                unappliedSearch
                  ? 'No unapplied students match your search criteria.'
                  : 'Every active student in the university roster has applied to at least one campus recruitment drive.'
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '220px' }}>Student</th>
                    <th style={{ width: '160px' }}>Department</th>
                    <th className="col-numeric" style={{ textAlign: 'right', width: '90px' }}>CGPA</th>
                    <th className="col-numeric" style={{ textAlign: 'right', width: '90px' }}>Backlogs</th>
                    <th className="col-status" style={{ width: '140px', textAlign: 'center' }}>Placement Status</th>
                    <th className="col-status" style={{ width: '110px', textAlign: 'center' }}>Roster</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnapplied.map((student) => (
                    <tr key={student.studentId}>
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          #{student.studentId} • {student.email}
                        </div>
                      </td>
                      <td style={{ width: '160px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {student.departmentName || '—'}
                        </span>
                      </td>
                      <td className="col-numeric" style={{ width: '90px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {student.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}
                      </td>
                      <td className="col-numeric" style={{ width: '90px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {student.backlogs > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            {student.backlogs}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                        )}
                      </td>
                      <td className="col-status" style={{ width: '140px', textAlign: 'center' }}>
                        <StatusBadge status={student.placementStatus || 'NOT_PLACED'} />
                      </td>
                      <td className="col-status" style={{ width: '110px', textAlign: 'center' }}>
                        {student.isArchived ? (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 600 }}>
                            Archived
                          </span>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Jobs Ranked by Applicants                                          */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <div className="card">
          {/* Tab Toolbar */}
          <div
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', flex: 1 }}>
              <div style={{ minWidth: '220px', maxWidth: '360px', flex: 1 }}>
                <SearchInput
                  placeholder="Search title, company, role..."
                  value={jobsSearch}
                  onChange={setJobsSearch}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  value={jobsSort}
                  onChange={(e) => setJobsSort(e.target.value)}
                  aria-label="Sort job openings"
                >
                  <option value="applicants-desc">Applicants (Highest first)</option>
                  <option value="applicants-asc">Applicants (Lowest first)</option>
                  <option value="package-desc">Package (Highest first)</option>
                  <option value="deadline-asc">Deadline (Earliest)</option>
                  <option value="title-asc">Job Title (A–Z)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredJobs.length}</strong> openings
            </div>
          </div>

          {/* Table Content */}
          {loadingJobs ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No Job Postings Found"
              description={
                jobsSearch
                  ? 'No job openings match your search filter.'
                  : 'No corporate recruitment drives are registered in the system.'
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                    <th style={{ minWidth: '220px' }}>Job Opportunity</th>
                    <th className="col-numeric" style={{ width: '130px', textAlign: 'right' }}>Package (CTC)</th>
                    <th className="col-date" style={{ width: '130px' }}>Deadline</th>
                    <th style={{ width: '150px' }}>Eligibility</th>
                    <th style={{ width: '220px' }}>Applicants Demand</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, idx) => {
                    const ratio = Math.min(100, Math.round(((job.applicantCount || 0) / maxApplicants) * 100));
                    return (
                      <tr key={job.jobId}>
                        {/* Rank */}
                        <td style={{ width: '60px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 26,
                              height: 26,
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                              backgroundColor: idx === 0 ? 'var(--color-primary-100)' : 'var(--color-surface-hover)',
                              color: idx === 0 ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Job + Company */}
                        <td style={{ minWidth: '220px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {job.jobTitle}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {job.companyName} • <span style={{ fontFamily: 'var(--font-mono)' }}>#{job.jobId}</span>
                          </div>
                        </td>

                        {/* Package */}
                        <td className="col-numeric" style={{ width: '130px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {formatSalary(job.packageAmount)}
                        </td>

                        {/* Deadline */}
                        <td className="col-date" style={{ width: '130px', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {formatDate(job.deadline)}
                        </td>

                        {/* Criteria */}
                        <td style={{ width: '150px', fontSize: 'var(--text-xs)' }}>
                          <div>Min CGPA: <strong>{job.minCgpa ?? '—'}</strong></div>
                          <div style={{ color: 'var(--color-text-muted)' }}>Max Backlogs: {job.maxBacklogs ?? 0}</div>
                        </td>

                        {/* Inline Proportional 6px Bar Ranking per Specification */}
                        <td style={{ width: '220px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                {job.applicantCount} {job.applicantCount === 1 ? 'applicant' : 'applicants'}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                {ratio}%
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 6,
                                backgroundColor: 'var(--color-surface-hover)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                                border: '1px solid var(--color-border-subtle)',
                              }}
                            >
                              <div
                                style={{
                                  width: `${ratio}%`,
                                  height: '100%',
                                  backgroundColor: 'var(--color-primary-600)',
                                  borderRadius: 'var(--radius-full)',
                                  transition: 'width var(--duration-normal)',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Students in Interview Process                                      */}
      {/* ========================================================================= */}
      {activeTab === 'interviewing' && (
        <div className="card">
          {/* Tab Toolbar */}
          <div
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', flex: 1 }}>
              <div style={{ minWidth: '220px', maxWidth: '360px', flex: 1 }}>
                <SearchInput
                  placeholder="Search candidate, role, company..."
                  value={interviewSearch}
                  onChange={setInterviewSearch}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  value={interviewStageFilter}
                  onChange={(e) => setInterviewStageFilter(e.target.value)}
                  aria-label="Filter interview stage"
                >
                  <option value="ALL">All Pipeline Stages</option>
                  <option value="PENDING_ROUND">Pending Assessment Rounds</option>
                  <option value="AWAITING_SCHEDULE">Shortlisted (Awaiting Round)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredInterviews.length}</strong> candidates
            </div>
          </div>

          {/* Table Content */}
          {loadingInterviews ? (
            <SkeletonTable rows={6} cols={6} />
          ) : filteredInterviews.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No Candidates in Pipeline"
              description={
                interviewSearch || interviewStageFilter !== 'ALL'
                  ? 'No candidates match your current pipeline filters.'
                  : 'There are currently no candidates in active interview evaluation stages.'
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '200px' }}>Candidate</th>
                    <th style={{ width: '150px' }}>Department</th>
                    <th style={{ minWidth: '200px' }}>Role & Company</th>
                    <th className="col-status" style={{ width: '130px', textAlign: 'center' }}>App Status</th>
                    <th style={{ width: '150px' }}>Interview Round</th>
                    <th className="col-date" style={{ width: '130px' }}>Date</th>
                    <th className="col-status" style={{ width: '130px', textAlign: 'center' }}>Outcome Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((row, idx) => (
                    <tr key={`${row.applicationId}-${row.interviewId || 'unassigned'}-${idx}`}>
                      {/* Candidate */}
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {row.studentName}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          #{row.studentId} • {row.email}
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ width: '150px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                          {row.departmentName || '—'}
                        </span>
                      </td>

                      {/* Job & Company */}
                      <td style={{ minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {row.jobTitle}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {row.companyName}
                        </div>
                      </td>

                      {/* App Status */}
                      <td className="col-status" style={{ width: '130px', textAlign: 'center' }}>
                        <StatusBadge status={row.applicationStatus} />
                      </td>

                      {/* Interview Round */}
                      <td style={{ width: '150px' }}>
                        {row.interviewId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>Round {row.roundNumber}</span>
                            <CategoryTag label={row.roundType || 'General Round'} />
                          </div>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Awaiting schedule
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="col-date" style={{ width: '130px', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatDate(row.interviewDate)}
                      </td>

                      {/* Outcome Status */}
                      <td className="col-status" style={{ width: '130px', textAlign: 'center' }}>
                        {row.interviewResult ? (
                          <StatusBadge status={row.interviewResult} />
                        ) : (
                          <StatusBadge status="PENDING" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
