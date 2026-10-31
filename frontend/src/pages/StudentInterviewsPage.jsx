import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Building2,
  Clock,
  Eye,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import { interviewsApi } from '../api/interviews';
import StatusBadge from '../components/common/StatusBadge';
import { Card, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';

const ROUND_TYPES = ['Technical', 'HR', 'Aptitude', 'Managerial', 'Group Discussion'];
const RESULT_OPTIONS = [
  { value: '', label: 'All Results' },
  { value: 'Pending', label: 'Pending / Scheduled' },
  { value: 'Passed', label: 'Passed / Cleared' },
  { value: 'Failed', label: 'Not Cleared' },
];

export function StudentInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);

  const loadInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await interviewsApi.getAll();
      setInterviews(data || []);
    } catch (err) {
      console.error('Failed to load my interviews:', err);
      setError(err.message || 'Unable to retrieve your interview schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const jobTitle = item.application?.job?.jobTitle?.toLowerCase() || '';
      const companyName = item.application?.job?.company?.companyName?.toLowerCase() || '';
      const roundType = item.roundType?.toLowerCase() || '';
      const matchesSearch = !q || jobTitle.includes(q) || companyName.includes(q) || roundType.includes(q);

      const matchesRound = !roundTypeFilter || item.roundType === roundTypeFilter;

      let matchesResult = true;
      if (resultFilter) {
        if (resultFilter === 'Pending') {
          matchesResult = !item.result || item.result === 'Pending' || item.result === 'SCHEDULED';
        } else {
          matchesResult = item.result === resultFilter;
        }
      }

      // Tab filtering
      const interviewDate = item.interviewDate ? String(item.interviewDate).split('T')[0] : '';
      let matchesTab = true;
      if (activeTab === 'UPCOMING') {
        matchesTab = interviewDate >= todayStr && (!item.result || item.result === 'Pending' || item.result === 'SCHEDULED');
      } else if (activeTab === 'COMPLETED') {
        matchesTab = interviewDate < todayStr || (item.result === 'Passed' || item.result === 'Failed');
      }

      return matchesSearch && matchesRound && matchesResult && matchesTab;
    });
  }, [interviews, searchQuery, roundTypeFilter, resultFilter, activeTab, todayStr]);

  // Derived counts
  const counts = useMemo(() => {
    const upcoming = interviews.filter((i) => {
      const d = i.interviewDate ? String(i.interviewDate).split('T')[0] : '';
      return d >= todayStr && (!i.result || i.result === 'Pending' || i.result === 'SCHEDULED');
    });
    const passed = interviews.filter((i) => i.result === 'Passed').length;
    const completed = interviews.filter((i) => {
      const d = i.interviewDate ? String(i.interviewDate).split('T')[0] : '';
      return d < todayStr || (i.result === 'Passed' || i.result === 'Failed');
    }).length;

    return {
      total: interviews.length,
      upcomingCount: upcoming.length,
      nextUpcoming: upcoming[0] || null,
      passedCount: passed,
      completedCount: completed,
    };
  }, [interviews, todayStr]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '70px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could Not Load Interviews"
        message={error}
        onRetry={loadInterviews}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 800 }}>My Interviews</h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            View your upcoming assessment rounds, dates, and evaluation results.
          </p>
        </div>

        <Link to="/my-applications" style={{ textDecoration: 'none' }}>
          <Button variant="secondary">
            View My Applications
          </Button>
        </Link>
      </div>

      {/* 2. Next Interview Callout (if scheduled) */}
      {counts.nextUpcoming && (
        <Card
          style={{
            border: '2px solid rgba(59, 130, 246, 0.4)',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
          }}
        >
          <CardBody>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--color-info, #3B82F6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-info, #3B82F6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Upcoming Round Scheduled
                    </span>
                    <Sparkles size={14} style={{ color: 'var(--color-info, #3B82F6)' }} />
                  </div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 800 }}>
                    Round {counts.nextUpcoming.roundNumber}: {counts.nextUpcoming.roundType} Interview
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span>Company: <strong>{counts.nextUpcoming.application?.job?.company?.companyName}</strong></span>
                    <span>•</span>
                    <span>Role: <strong>{counts.nextUpcoming.application?.job?.jobTitle}</strong></span>
                    <span>•</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      Date: {formatDate(counts.nextUpcoming.interviewDate)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedInterview(counts.nextUpcoming)}
              >
                View Round Details
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 3. Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Rounds</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem' }}>{counts.total}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-info, #3B82F6)', textTransform: 'uppercase', fontWeight: 600 }}>Upcoming Slots</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-info, #3B82F6)' }}>{counts.upcomingCount}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success, #10B981)', textTransform: 'uppercase', fontWeight: 600 }}>Rounds Cleared</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem', color: 'var(--color-success, #10B981)' }}>{counts.passedCount}</div>
        </div>
        <div style={{ padding: '0.9rem 1.1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.15rem' }}>{counts.completedCount}</div>
        </div>
      </div>

      {/* 4. Tab Navigation and Search/Filters */}
      <Card>
        <CardBody style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Rounds ({interviews.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('UPCOMING')}
            >
              Upcoming ({counts.upcomingCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'COMPLETED' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Completed ({counts.completedCount})
            </button>
          </div>

          {/* Search & Select Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by company or job title..."
              />
            </div>
            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                value={roundTypeFilter}
                onChange={(e) => setRoundTypeFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.875rem' }}
                aria-label="Filter by round type"
              >
                <option value="">All Round Types</option>
                {ROUND_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: '160px' }}>
              <select
                className="form-control"
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                style={{ height: '38px', fontSize: '0.875rem' }}
                aria-label="Filter by interview result"
              >
                {RESULT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 5. Interviews Table */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={interviews.length === 0 ? 'No Interview Rounds Scheduled Yet' : 'No Matching Interview Records'}
          description={
            interviews.length === 0
              ? 'When corporate recruiters evaluate and shortlist your applications, your interview rounds and dates will appear here.'
              : 'Try clearing your filters or changing the active tab to view other interview rounds.'
          }
        />
      ) : (
        <Card>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Company & Position</th>
                  <th>Interview Date</th>
                  <th>Status / Outcome</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((item) => (
                  <tr key={item.interviewId}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Round {item.roundNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {item.roundType} Interview
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{item.application?.job?.company?.companyName || 'Corporate Partner'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {item.application?.job?.jobTitle || 'Role'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                        <Calendar size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{formatDate(item.interviewDate)}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.result || 'Pending'} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        onClick={() => setSelectedInterview(item)}
                        title="View Interview Details"
                        aria-label="View Interview Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. Details Modal */}
      <Modal
        isOpen={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        title="Interview Round Details"
        footer={
          <Button variant="secondary" onClick={() => setSelectedInterview(null)}>
            Close
          </Button>
        }
      >
        {selectedInterview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Interview Round #{selectedInterview.roundNumber}
                </span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.15rem' }}>
                  {selectedInterview.roundType} Assessment
                </div>
              </div>
              <StatusBadge status={selectedInterview.result || 'Pending'} />
            </div>

            {/* Schedule Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Interview Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDate(selectedInterview.interviewDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Evaluation Result</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedInterview.result || 'Pending Outcome'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hiring Company</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {selectedInterview.application?.job?.company?.companyName || 'Corporate Partner'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Job Opening</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {selectedInterview.application?.job?.jobTitle || 'Role'}
                </div>
              </div>
            </div>

            {/* Note Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-hover)',
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                Please check your university email for virtual meeting links or campus venue instructions prior to your scheduled interview round.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StudentInterviewsPage;
