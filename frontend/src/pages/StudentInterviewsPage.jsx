import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Briefcase,
  Building2,
  Eye,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';

import { interviewsApi } from '../api/interviews';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';

const ROUND_TYPES = ['Technical', 'HR', 'Aptitude', 'Managerial', 'Group Discussion'];

export function StudentInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('UPCOMING'); // 'UPCOMING' | 'COMPLETED' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
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

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const counts = useMemo(() => {
    const upcoming = interviews.filter((i) => {
      const d = i.interviewDate ? String(i.interviewDate).split('T')[0] : '';
      return d >= todayStr && (!i.result || i.result === 'Pending' || i.result === 'SCHEDULED');
    });
    const completed = interviews.filter((i) => {
      const d = i.interviewDate ? String(i.interviewDate).split('T')[0] : '';
      return d < todayStr || (i.result === 'Passed' || i.result === 'Failed');
    });

    return {
      all: interviews.length,
      upcoming: upcoming.length,
      completed: completed.length,
    };
  }, [interviews, todayStr]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const jobTitle = item.application?.job?.jobTitle?.toLowerCase() || '';
      const companyName = item.application?.job?.company?.companyName?.toLowerCase() || '';
      const matchesSearch = !q || jobTitle.includes(q) || companyName.includes(q);

      const matchesRound = !roundTypeFilter || item.roundType === roundTypeFilter;

      const interviewDate = item.interviewDate ? String(item.interviewDate).split('T')[0] : '';
      let matchesTab = true;
      if (activeTab === 'UPCOMING') {
        matchesTab = interviewDate >= todayStr && (!item.result || item.result === 'Pending' || item.result === 'SCHEDULED');
      } else if (activeTab === 'COMPLETED') {
        matchesTab = interviewDate < todayStr || (item.result === 'Passed' || item.result === 'Failed');
      }

      return matchesSearch && matchesRound && matchesTab;
    });
  }, [interviews, searchQuery, roundTypeFilter, activeTab, todayStr]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', opacity: 0.6 }} />
        <SkeletonTable rows={5} cols={5} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-title-area">
          <h1 className="page-header-title">My Interviews</h1>
          <p className="page-header-subtitle">
            Upcoming schedules, rounds assessment, and selection interview history
          </p>
        </div>
      </div>

      {/* 1. Underline Tabs with Count Badges */}
      <div className="tabs-nav" role="tablist" aria-label="Interview schedule categories">
        <button
          type="button"
          className={`tab-item ${activeTab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setActiveTab('UPCOMING')}
          role="tab"
          aria-selected={activeTab === 'UPCOMING'}
        >
          <span>Upcoming</span>
          <span className="tab-count">{counts.upcoming}</span>
        </button>

        <button
          type="button"
          className={`tab-item ${activeTab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setActiveTab('COMPLETED')}
          role="tab"
          aria-selected={activeTab === 'COMPLETED'}
        >
          <span>Completed</span>
          <span className="tab-count">{counts.completed}</span>
        </button>

        <button
          type="button"
          className={`tab-item ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
          role="tab"
          aria-selected={activeTab === 'ALL'}
        >
          <span>All Rounds</span>
          <span className="tab-count">{counts.all}</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar-search">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by role or company..."
          />
        </div>

        <select
          value={roundTypeFilter}
          onChange={(e) => setRoundTypeFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          aria-label="Filter by round type"
        >
          <option value="">All Round Types</option>
          {ROUND_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {(searchQuery || roundTypeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setRoundTypeFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* 3. Content: Schedule Cards for Upcoming, Table for Others */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={
            activeTab === 'UPCOMING'
              ? 'No upcoming interviews scheduled'
              : activeTab === 'COMPLETED'
              ? 'No completed interviews yet'
              : 'No matching interviews found'
          }
          description={
            activeTab === 'UPCOMING'
              ? 'When recruitment coordinators schedule evaluation rounds for your shortlisted applications, they will appear here.'
              : 'Interviews you complete will be recorded with their selection assessment.'
          }
          actionText={searchQuery || roundTypeFilter ? 'Clear filters' : 'Browse Open Jobs'}
          onAction={() => {
            if (searchQuery || roundTypeFilter) {
              setSearchQuery('');
              setRoundTypeFilter('');
            }
          }}
        />
      ) : activeTab === 'UPCOMING' ? (
        /* Upcoming Schedule Cards Layout per Blueprint 5.16 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filteredInterviews.map((item) => {
            const intDate = item.interviewDate ? new Date(item.interviewDate) : null;
            const isToday =
              intDate &&
              intDate.toISOString().split('T')[0] === todayStr;

            return (
              <Card key={item.interviewId} style={{ borderLeft: isToday ? '4px solid var(--color-warning)' : '4px solid var(--color-info)' }}>
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
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-surface-hover)',
                          border: '1px solid var(--color-border)',
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {intDate ? intDate.getDate() : '—'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {intDate ? intDate.toLocaleString('default', { month: 'short' }) : ''}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                          <CategoryTag>{item.roundType || `Round ${item.roundNumber}`}</CategoryTag>
                          <span className="record-id" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            Round #{item.roundNumber || 1}
                          </span>
                          {isToday && <span className="badge badge-warning">Today</span>}
                        </div>

                        <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 600 }}>
                          {item.application?.job?.company?.companyName || 'Corporate Partner'} — {item.application?.job?.jobTitle || 'Role'}
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          Date: {formatDate(item.interviewDate)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <StatusBadge status={item.result || 'PENDING'} />
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedInterview(item)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Structured Table for Completed & All Tabs */
        <div className="table-container">
          <table className="table" aria-label="Interview history table">
            <thead>
              <tr>
                <th className="sticky-col-first">Role & Corporate Partner</th>
                <th>Round Type</th>
                <th>Round #</th>
                <th>Interview Date</th>
                <th>Outcome Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((item) => (
                <tr key={item.interviewId}>
                  <td className="sticky-col-first">
                    <div className="cell-primary">
                      <span className="cell-title">{item.application?.job?.jobTitle || `Job #${item.application?.jobId}`}</span>
                      <span className="cell-subtitle">{item.application?.job?.company?.companyName || 'Corporate Partner'}</span>
                    </div>
                  </td>
                  <td>
                    <CategoryTag>{item.roundType || 'Assessment'}</CategoryTag>
                  </td>
                  <td className="col-numeric">
                    <span className="record-id">#{item.roundNumber || 1}</span>
                  </td>
                  <td>{formatDate(item.interviewDate)}</td>
                  <td>
                    <StatusBadge status={item.result || 'PENDING'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedInterview(item)}
                      aria-label="View interview details"
                    >
                      <Eye size={14} strokeWidth={1.75} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Interview View Modal */}
      {selectedInterview && (
        <Modal
          isOpen={!!selectedInterview}
          onClose={() => setSelectedInterview(null)}
          title="Interview Round Details"
          subtitle={`${selectedInterview.application?.job?.company?.companyName || 'Corporate Partner'} — ${selectedInterview.application?.job?.jobTitle || 'Role'}`}
          size="md"
          footer={
            <Button variant="secondary" onClick={() => setSelectedInterview(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Assessment Outcome
              </span>
              <StatusBadge status={selectedInterview.result || 'PENDING'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Interview ID</span>
                <span className="record-id" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  INT-#{selectedInterview.interviewId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Evaluation Round</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  Round {selectedInterview.roundNumber} ({selectedInterview.roundType})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Scheduled Date</span>
                <span style={{ fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDate(selectedInterview.interviewDate)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Position Role</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>
                  {selectedInterview.application?.job?.jobTitle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Hiring Partner</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {selectedInterview.application?.job?.company?.companyName}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StudentInterviewsPage;
