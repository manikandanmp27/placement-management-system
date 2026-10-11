import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Building2,
  User,
  Clock,
  CheckCircle,
} from 'lucide-react';

import { interviewsApi } from '../api/interviews';
import { applicationsApi } from '../api/applications';
import { useToast } from '../contexts/ToastContext';

import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';

import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import { formatDate, isExpired } from '../utils/formatters';

const ROUND_TYPES = ['Technical', 'HR', 'Aptitude', 'Managerial', 'Group Discussion'];
const RESULTS = ['Pending', 'Passed', 'Failed'];

export function InterviewsPage() {
  const toast = useToast();

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

  const [formData, setFormData] = useState({
    interviewId: '',
    applicationId: '',
    roundNumber: '1',
    roundType: 'Technical',
    interviewDate: new Date().toISOString().split('T')[0],
    result: 'Pending',
  });
  const [formErrors, setFormErrors] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [interviewsData, appsData] = await Promise.all([
        interviewsApi.getAll(),
        applicationsApi.getAll().catch(() => []),
      ]);
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      console.error('Failed to load interviews:', err);
      setError(err.message || 'Failed to fetch interview schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      const matchesTab =
        scheduleTab === 'ALL' ||
        (scheduleTab === 'UPCOMING' && !isPast) ||
        (scheduleTab === 'COMPLETED' && (isPast || item.result !== 'Pending'));

      return matchesSearch && matchesRound && matchesResult && matchesTab;
    });
  }, [interviews, searchQuery, roundTypeFilter, resultFilter, scheduleTab]);

  const handleView = (interview) => {
    setSelectedInterview(interview);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!interviewToDelete) return;
    try {
      setIsDeleting(true);
      await interviewsApi.delete(interviewToDelete.interviewId);
      toast.success(`Interview round #${interviewToDelete.interviewId} deleted.`);
      setInterviewToDelete(null);
      loadData();
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
        interviewDate: new Date().toISOString().split('T')[0],
        result: 'Pending',
      });
      loadData();
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      toast.error(err.message || 'Failed to schedule interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
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
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0 }}>
            Interview Schedules
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Assessment rounds, technical evaluations, HR discussions, and outcome tracking.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormErrors({});
            setIsCreateModalOpen(true);
          }}
          id="btn-schedule-interview"
        >
          Schedule Interview
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'ALL', label: 'All Interviews' },
          { key: 'UPCOMING', label: 'Upcoming Sessions' },
          { key: 'COMPLETED', label: 'Completed Rounds' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${scheduleTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setScheduleTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className="card"
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search candidate, company, role..."
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
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
          Total Sessions: <strong>{filteredInterviews.length}</strong>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredInterviews.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Interviews Found"
          description={
            searchQuery || roundTypeFilter || resultFilter || scheduleTab !== 'ALL'
              ? 'No interview sessions match the active criteria.'
              : 'There are currently no interview schedules recorded.'
          }
          actionText="Schedule Interview"
          actionIcon={Plus}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Candidate</th>
                  <th>Job & Company</th>
                  <th>Round</th>
                  <th>Date</th>
                  <th>Result</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviews.map((item) => (
                  <tr key={item.interviewId}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{item.interviewId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.application?.student?.name || `Candidate #${item.application?.student?.studentId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        App ID: #{item.application?.applicationId}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {item.application?.job?.jobTitle || `Job #${item.application?.job?.jobId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {item.application?.job?.company?.companyName}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>Round {item.roundNumber}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.roundType || 'General'}
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}>
                      {formatDate(item.interviewDate)}
                    </td>
                    <td>
                      <StatusBadge status={item.result} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => handleView(item)}
                          aria-label={`View details of interview #${item.interviewId}`}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          onClick={() => setInterviewToDelete(item)}
                          aria-label={`Delete interview #${item.interviewId}`}
                          title="Delete Interview"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Interview #${selectedInterview?.interviewId} Details`}
        footer={
          <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedInterview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Assessment Result
                </span>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedInterview.result} />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Round Scheduled Date
                </span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                  {formatDate(selectedInterview.interviewDate)}
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Round Details
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>
                  Round {selectedInterview.roundNumber} ({selectedInterview.roundType})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Application Reference
                </div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '2px' }}>
                  Application #{selectedInterview.application?.applicationId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Candidate
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                  {selectedInterview.application?.student?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  ID: #{selectedInterview.application?.student?.studentId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Company & Role
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
                  {selectedInterview.application?.job?.jobTitle}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {selectedInterview.application?.job?.company?.companyName}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Interview Round"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={isSubmitting}
              id="submit-schedule-interview-btn"
            >
              Schedule Round
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormInput
              label="Interview ID"
              name="interviewId"
              type="number"
              value={formData.interviewId}
              onChange={(e) => setFormData({ ...formData, interviewId: e.target.value })}
              placeholder="e.g. 413"
              required
              error={formErrors.interviewId}
              helpText="Unique numeric interview ID"
            />

            <FormSelect
              label="Associated Application"
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
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
                label="Result Status"
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

      <ConfirmDialog
        isOpen={!!interviewToDelete}
        onClose={() => setInterviewToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Interview Schedule"
        message={`Are you sure you want to remove interview session #${interviewToDelete?.interviewId}?`}
        confirmText="Delete Interview"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default InterviewsPage;
