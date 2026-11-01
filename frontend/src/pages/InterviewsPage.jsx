import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';

import { interviewsApi } from '../api/interviews';
import { applicationsApi } from '../api/applications';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { Card } from '../components/common/Card';
import { SearchInput } from '../components/common/SearchInput';
import { StatusBadge, CategoryTag } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { formatDate, isExpired } from '../utils/formatters';

const ROUND_TYPES = ['Technical', 'HR', 'Aptitude', 'Managerial', 'Group Discussion'];
const RESULTS = ['Pending', 'Passed', 'Failed'];
const TODAY_DATE = new Date().toISOString().split('T')[0];

export function InterviewsPage() {
  const { toast } = useToast();
  const { isStudent } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roundTypeFilter, setRoundTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [scheduleTab, setScheduleTab] = useState('ALL');

  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outcome update state
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [outcomeInterview, setOutcomeInterview] = useState(null);
  const [newOutcomeValue, setNewOutcomeValue] = useState('Pending');
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState(false);

  const [formData, setFormData] = useState({
    interviewId: '',
    applicationId: '',
    roundNumber: '1',
    roundType: 'Technical',
    interviewDate: TODAY_DATE,
    result: 'Pending',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [interviewsData, appsData] = await Promise.all([
        interviewsApi.getAll(),
        !isStudent ? applicationsApi.getAll().catch(() => []) : Promise.resolve([]),
      ]);
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setError(err.message || 'Failed to fetch interview schedules.');
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { ALL: interviews.length, UPCOMING: 0, COMPLETED: 0 };
    interviews.forEach((item) => {
      const isPast = isExpired(item.interviewDate);
      if (!isPast && item.result === 'Pending') {
        counts.UPCOMING++;
      } else {
        counts.COMPLETED++;
      }
    });
    return counts;
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const studentName = item.application?.student?.name?.toLowerCase() || '';
      const jobTitle = item.application?.job?.jobTitle?.toLowerCase() || '';
      const companyName = item.application?.job?.company?.companyName?.toLowerCase() || '';

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        jobTitle.includes(q) ||
        companyName.includes(q) ||
        String(item.interviewId).includes(q);

      const matchesRound = !roundTypeFilter || item.roundType === roundTypeFilter;
      const matchesResult = !resultFilter || item.result?.toUpperCase() === resultFilter.toUpperCase();

      const isPast = isExpired(item.interviewDate);
      const isUpcoming = !isPast && item.result === 'Pending';
      const matchesTab =
        scheduleTab === 'ALL' ||
        (scheduleTab === 'UPCOMING' && isUpcoming) ||
        (scheduleTab === 'COMPLETED' && !isUpcoming);

      return matchesSearch && matchesRound && matchesResult && matchesTab;
    });
  }, [interviews, searchQuery, roundTypeFilter, resultFilter, scheduleTab]);

  const handleView = (interview) => {
    setSelectedInterview(interview);
    setIsViewModalOpen(true);
  };

  const handleOpenOutcomeModal = (interview) => {
    setOutcomeInterview(interview);
    setNewOutcomeValue(interview.result || 'Pending');
    setIsOutcomeModalOpen(true);
  };

  const handleUpdateOutcome = async (e) => {
    if (e) e.preventDefault();
    if (!outcomeInterview) return;

    try {
      setIsUpdatingOutcome(true);
      await interviewsApi.updateResult(outcomeInterview.interviewId, newOutcomeValue);
      toast.success(`Interview #${outcomeInterview.interviewId} outcome updated to "${newOutcomeValue}"`);
      setIsOutcomeModalOpen(false);

      if (selectedInterview && selectedInterview.interviewId === outcomeInterview.interviewId) {
        setSelectedInterview((prev) => (prev ? { ...prev, result: newOutcomeValue } : null));
      }
      setOutcomeInterview(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update interview outcome:', err);
      toast.error(err.message || 'Failed to update interview outcome.');
    } finally {
      setIsUpdatingOutcome(false);
    }
  };

  const handleDelete = async () => {
    if (!interviewToDelete) return;
    try {
      setIsDeleting(true);
      await interviewsApi.delete(interviewToDelete.interviewId);
      toast.success(`Interview round #${interviewToDelete.interviewId} deleted.`);
      setInterviewToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete interview:', err);
      toast.error(err.message || 'Failed to delete interview round.');
    } finally {
      setIsDeleting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.interviewId || isNaN(formData.interviewId) || Number(formData.interviewId) <= 0) {
      errors.interviewId = 'Valid positive Interview ID is required';
    }
    if (!formData.applicationId) {
      errors.applicationId = 'Application must be selected';
    }
    if (!formData.roundNumber || isNaN(formData.roundNumber) || Number(formData.roundNumber) <= 0) {
      errors.roundNumber = 'Valid round number is required';
    }
    if (!formData.interviewDate) {
      errors.interviewDate = 'Interview date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const appObj = applications.find(
        (a) => String(a.applicationId) === String(formData.applicationId)
      );

      const payload = {
        interviewId: Number(formData.interviewId),
        application: {
          applicationId: Number(formData.applicationId),
          student: appObj?.student,
          job: appObj?.job,
        },
        roundNumber: Number(formData.roundNumber),
        roundType: formData.roundType,
        interviewDate: formData.interviewDate,
        result: formData.result,
      };

      await interviewsApi.create(payload);
      toast.success(`Interview #${payload.interviewId} scheduled successfully!`);
      setIsCreateModalOpen(false);
      setFormData({
        interviewId: '',
        applicationId: '',
        roundNumber: '1',
        roundType: 'Technical',
        interviewDate: TODAY_DATE,
        result: 'Pending',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Interviews</h1>
          <p className="page-subtitle">
            Assessment schedules, technical evaluations, HR discussions, and outcome tracking.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh interview schedules"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {!isStudent && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
              id="btn-schedule-interview"
            >
              <Plus size={16} />
              <span>Schedule Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" role="tablist" style={{ marginBottom: 'var(--space-6)' }}>
        <button
          type="button"
          role="tab"
          aria-selected={scheduleTab === 'ALL'}
          className={`tab-btn ${scheduleTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setScheduleTab('ALL')}
        >
          <span>All Interviews</span>
          <span className="tab-badge">{tabCounts.ALL}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={scheduleTab === 'UPCOMING'}
          className={`tab-btn ${scheduleTab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setScheduleTab('UPCOMING')}
        >
          <span>Upcoming Sessions</span>
          <span className="tab-badge">{tabCounts.UPCOMING}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={scheduleTab === 'COMPLETED'}
          className={`tab-btn ${scheduleTab === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setScheduleTab('COMPLETED')}
        >
          <span>Completed Rounds</span>
          <span className="tab-badge">{tabCounts.COMPLETED}</span>
        </button>
      </div>

      {/* Main Content Card */}
      <Card>
        {/* FilterBar */}
        <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search candidate, company, role..."
            className="filter-search"
            id="interview-search-input"
          />

          <div style={{ minWidth: 170 }}>
            <select
              className="form-select"
              value={roundTypeFilter}
              onChange={(e) => setRoundTypeFilter(e.target.value)}
              aria-label="Filter by round type"
            >
              <option value="">All Round Types</option>
              {ROUND_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="form-select"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              aria-label="Filter by interview result"
            >
              <option value="">All Results</option>
              {RESULTS.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || roundTypeFilter || resultFilter) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setRoundTypeFilter('');
                setResultFilter('');
              }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredInterviews.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{interviews.length}</strong> sessions
          </div>
        </div>

        {/* State Management */}
        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <ErrorState
            title="Couldn't load interview sessions"
            message={error}
            onRetry={loadData}
          />
        ) : filteredInterviews.length === 0 ? (
          <EmptyState
            title={
              searchQuery || roundTypeFilter || resultFilter
                ? 'No matching interviews'
                : scheduleTab === 'UPCOMING'
                ? 'No upcoming interviews'
                : scheduleTab === 'COMPLETED'
                ? 'No completed interviews yet'
                : 'No interviews scheduled'
            }
            message={
              searchQuery || roundTypeFilter || resultFilter
                ? 'No interview sessions match the active search and filter criteria.'
                : scheduleTab === 'UPCOMING'
                ? 'There are no pending interview assessments scheduled for the upcoming dates.'
                : 'There are currently no interview records in this view.'
            }
            action={
              searchQuery || roundTypeFilter || resultFilter ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setRoundTypeFilter('');
                    setResultFilter('');
                  }}
                >
                  Clear filters
                </button>
              ) : !isStudent ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={15} />
                  <span>Schedule Interview</span>
                </button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Desktop Table View (≥768px) */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '200px' }}>Candidate</th>
                    <th style={{ minWidth: '200px' }}>Role & Company</th>
                    <th style={{ width: '150px' }}>Round</th>
                    <th className="col-date" style={{ width: '150px' }}>Date</th>
                    <th className="col-status" style={{ width: '130px', textAlign: 'center' }}>Outcome</th>
                    <th className="col-actions" style={{ textAlign: 'right', width: isStudent ? '80px' : '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((item) => {
                    const isToday = item.interviewDate === TODAY_DATE;

                    return (
                      <tr
                        key={item.interviewId}
                        style={isToday ? { borderLeft: '3px solid var(--color-warning-500)' } : undefined}
                      >
                        {/* 1. Candidate */}
                        <td style={{ minWidth: '200px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {item.application?.student?.name || `Candidate #${item.application?.student?.studentId}`}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ID: #{item.application?.student?.studentId} • App #{item.application?.applicationId}
                          </div>
                        </td>

                        {/* 2. Role & Company */}
                        <td style={{ minWidth: '200px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {item.application?.job?.jobTitle || `Job #${item.application?.job?.jobId}`}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <Building2 size={12} />
                            <span>{item.application?.job?.company?.companyName || '—'}</span>
                          </div>
                        </td>

                        {/* 3. Round (Outlined CategoryTag) */}
                        <td style={{ width: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', fontVariantNumeric: 'tabular-nums' }}>
                              R{item.roundNumber}
                            </span>
                            <CategoryTag label={item.roundType || 'General'} />
                          </div>
                        </td>

                        {/* 4. Date */}
                        <td className="col-date" style={{ width: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                            <span style={{ fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-secondary)' }}>
                              {formatDate(item.interviewDate)}
                            </span>
                            {isToday && (
                              <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Today
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Result (Filled StatusBadge) */}
                        <td className="col-status" style={{ width: '130px', textAlign: 'center' }}>
                          <StatusBadge status={item.result} />
                        </td>

                        {/* 6. Actions */}
                        <td className="col-actions" style={{ width: isStudent ? '80px' : '150px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleView(item)}
                              aria-label={`View details of interview #${item.interviewId}`}
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>

                            {!isStudent && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleOpenOutcomeModal(item)}
                                  aria-label={`Record outcome for interview #${item.interviewId}`}
                                  title="Record outcome"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => setInterviewToDelete(item)}
                                  aria-label={`Delete interview #${item.interviewId}`}
                                  title="Delete interview"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Cards View (<768px) */}
            <div className="data-card-list">
              {filteredInterviews.map((item) => (
                <div key={item.interviewId} className="data-card">
                  <div className="data-card-header">
                    <div>
                      <div className="data-card-title">{item.application?.student?.name}</div>
                      <div className="data-card-subtitle">{item.application?.job?.jobTitle} • {item.application?.job?.company?.companyName}</div>
                    </div>
                    <div className="data-card-badge">
                      <StatusBadge status={item.result} />
                    </div>
                  </div>

                  <div className="data-card-grid">
                    <div className="data-card-field">
                      <div className="data-card-field-label">Round</div>
                      <div className="data-card-field-value">
                        Round {item.roundNumber} ({item.roundType})
                      </div>
                    </div>
                    <div className="data-card-field">
                      <div className="data-card-field-label">Date</div>
                      <div className="data-card-field-value">
                        {formatDate(item.interviewDate)}
                      </div>
                    </div>
                  </div>

                  <div className="data-card-footer">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleView(item)}
                      style={{ flex: 1 }}
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    {!isStudent && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenOutcomeModal(item)}
                        style={{ flex: 1 }}
                      >
                        <Pencil size={14} />
                        <span>Record Outcome</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* View Details Modal */}
      {isViewModalOpen && selectedInterview && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Interview #${selectedInterview.interviewId}`}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              {!isStudent && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenOutcomeModal(selectedInterview);
                  }}
                >
                  <Pencil size={14} />
                  <span>Update Outcome</span>
                </button>
              )}
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Assessment Outcome
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedInterview.result} />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Scheduled Date
                </span>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  {formatDate(selectedInterview.interviewDate)}
                </div>
              </div>
            </div>

            {/* Definition Grid */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-4)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Assessment Round
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  Round {selectedInterview.roundNumber}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <CategoryTag label={selectedInterview.roundType || 'General'} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Application Reference
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  App #{selectedInterview.application?.applicationId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Candidate
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  {selectedInterview.application?.student?.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: #{selectedInterview.application?.student?.studentId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Company & Role
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px', color: 'var(--color-text-primary)' }}>
                  {selectedInterview.application?.job?.jobTitle}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {selectedInterview.application?.job?.company?.companyName}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Outcome Modal (sm) with 3 Radio Cards */}
      {isOutcomeModalOpen && outcomeInterview && (
        <Modal
          isOpen={isOutcomeModalOpen}
          onClose={() => {
            if (!isUpdatingOutcome) {
              setIsOutcomeModalOpen(false);
              setOutcomeInterview(null);
            }
          }}
          title="Record Interview Outcome"
          size="sm"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsOutcomeModalOpen(false);
                  setOutcomeInterview(null);
                }}
                disabled={isUpdatingOutcome}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateOutcome}
                disabled={isUpdatingOutcome}
                id="submit-outcome-btn"
              >
                {isUpdatingOutcome ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Outcome</span>
                )}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Interview Context Header */}
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div><strong>Candidate:</strong> {outcomeInterview.application?.student?.name} (ID: #{outcomeInterview.application?.student?.studentId})</div>
              <div><strong>Role:</strong> {outcomeInterview.application?.job?.jobTitle} at {outcomeInterview.application?.job?.company?.companyName}</div>
              <div><strong>Round:</strong> Round {outcomeInterview.roundNumber} ({outcomeInterview.roundType})</div>
            </div>

            {/* Radio Cards for Outcome */}
            <div>
              <label className="form-label" style={{ marginBottom: 'var(--space-2)' }}>
                Select Assessment Result
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {/* 1. Passed Card */}
                <div
                  onClick={() => setNewOutcomeValue('Passed')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: newOutcomeValue === 'Passed' ? '2px solid var(--color-success-600)' : '1px solid var(--color-border)',
                    backgroundColor: newOutcomeValue === 'Passed' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--color-success-600)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Passed</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Candidate successfully cleared this evaluation round</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outcomeOption"
                    value="Passed"
                    checked={newOutcomeValue === 'Passed'}
                    onChange={() => setNewOutcomeValue('Passed')}
                    style={{ accentColor: 'var(--color-success-600)' }}
                  />
                </div>

                {/* 2. Pending Card */}
                <div
                  onClick={() => setNewOutcomeValue('Pending')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: newOutcomeValue === 'Pending' ? '2px solid var(--color-warning-500)' : '1px solid var(--color-border)',
                    backgroundColor: newOutcomeValue === 'Pending' ? 'var(--color-warning-bg)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Clock size={18} style={{ color: 'var(--color-warning-500)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Pending</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Evaluation is awaiting interviewer submission or review</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outcomeOption"
                    value="Pending"
                    checked={newOutcomeValue === 'Pending'}
                    onChange={() => setNewOutcomeValue('Pending')}
                    style={{ accentColor: 'var(--color-warning-500)' }}
                  />
                </div>

                {/* 3. Failed Card */}
                <div
                  onClick={() => setNewOutcomeValue('Failed')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: newOutcomeValue === 'Failed' ? '2px solid var(--color-danger-600)' : '1px solid var(--color-border)',
                    backgroundColor: newOutcomeValue === 'Failed' ? 'var(--color-danger-bg)' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <XCircle size={18} style={{ color: 'var(--color-danger-600)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>Failed</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Candidate did not meet criteria for this round</div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="outcomeOption"
                    value="Failed"
                    checked={newOutcomeValue === 'Failed'}
                    onChange={() => setNewOutcomeValue('Failed')}
                    style={{ accentColor: 'var(--color-danger-600)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Interview Modal (md) */}
      {!isStudent && isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Schedule Interview Round"
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', width: '100%' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={isSubmitting}
                id="submit-schedule-interview-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Scheduling…</span>
                  </>
                ) : (
                  <span>Schedule Round</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <FormInput
                label="Interview ID"
                name="interviewId"
                type="number"
                value={formData.interviewId}
                onChange={(e) => setFormData({ ...formData, interviewId: e.target.value })}
                placeholder="e.g. 413"
                required
                error={formErrors.interviewId}
                helperText="Unique numeric interview session ID"
                min={1}
              />

              <FormSelect
                label="Associated Candidate Application"
                name="applicationId"
                value={formData.applicationId}
                onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                options={applications.map((a) => ({
                  value: a.applicationId,
                  label: `App #${a.applicationId} - ${a.student?.name} (${a.job?.jobTitle} @ ${a.job?.company?.companyName})`,
                }))}
                required
                error={formErrors.applicationId}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Round Number"
                  name="roundNumber"
                  type="number"
                  min="1"
                  value={formData.roundNumber}
                  onChange={(e) => setFormData({ ...formData, roundNumber: e.target.value })}
                  required
                  error={formErrors.roundNumber}
                />

                <FormSelect
                  label="Round Type"
                  name="roundType"
                  value={formData.roundType}
                  onChange={(e) => setFormData({ ...formData, roundType: e.target.value })}
                  options={ROUND_TYPES.map((rt) => ({ value: rt, label: rt }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                <FormInput
                  label="Interview Date"
                  name="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  required
                  error={formErrors.interviewDate}
                />

                <FormSelect
                  label="Initial Outcome"
                  name="result"
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  options={RESULTS.map((res) => ({ value: res, label: res }))}
                  required
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {!isStudent && interviewToDelete && (
        <ConfirmDialog
          isOpen={!!interviewToDelete}
          onClose={() => !isDeleting && setInterviewToDelete(null)}
          onConfirm={handleDelete}
          title="Delete this interview schedule?"
          type="danger"
          confirmLabel="Delete Interview"
          confirmLoading={isDeleting}
          message={`Are you sure you want to remove interview session #${interviewToDelete.interviewId} (Round ${interviewToDelete.roundNumber})?`}
        />
      )}
    </div>
  );
}

export default InterviewsPage;


