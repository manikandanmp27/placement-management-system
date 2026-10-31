import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  UserX,
  UserCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { officersApi } from '../api/officers';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/common/Card';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

import { ErrorState } from '../components/common/ErrorState';
import { formatDate } from '../utils/formatters';

export function OfficerAccountsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status Change (Enable / Disable) Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOfficerForStatus, setSelectedOfficerForStatus] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedOfficerForReset, setSelectedOfficerForReset] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  const loadOfficers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await officersApi.getAll();
      setOfficers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load officer accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfficers();
  }, [loadOfficers]);

  // Derived filtered officers
  const filteredOfficers = useMemo(() => {
    return officers.filter((officer) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        officer.email.toLowerCase().includes(query) ||
        String(officer.userId).includes(query);

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = officer.enabled === true;
      } else if (statusFilter === 'DISABLED') {
        matchesStatus = officer.enabled === false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [officers, searchQuery, statusFilter]);

  // Derived metrics
  const totalOfficers = officers.length;
  const activeOfficers = officers.filter((o) => o.enabled).length;
  const disabledOfficers = officers.filter((o) => !o.enabled).length;

  // Handlers for Create
  const handleOpenCreateModal = () => {
    setCreateEmail('');
    setCreatePassword('');
    setCreateConfirmPassword('');
    setShowCreatePassword(false);
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    const normalizedEmail = createEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setCreateError('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setCreateError('Please enter a valid email address.');
      return;
    }

    if (!createPassword || createPassword.length < 8) {
      setCreateError('Password must be at least 8 characters in length.');
      return;
    }

    if (createPassword !== createConfirmPassword) {
      setCreateError('Passwords do not match.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const newOfficer = await officersApi.create({
        email: normalizedEmail,
        password: createPassword,
      });

      showToast(`Placement officer account for "${newOfficer.email}" created successfully.`, 'success');
      setIsCreateModalOpen(false);
      await loadOfficers();
    } catch (err) {
      setCreateError(err?.message || 'Failed to provision officer account.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handlers for Status Change (Enable / Disable)
  const handleOpenStatusModal = (officer) => {
    setSelectedOfficerForStatus(officer);
    setStatusError('');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedOfficerForStatus) return;

    const newStatus = !selectedOfficerForStatus.enabled;
    const actionLabel = newStatus ? 'enabled' : 'disabled';

    try {
      setStatusSubmitting(true);
      setStatusError('');

      await officersApi.updateStatus(selectedOfficerForStatus.userId, newStatus);
      showToast(
        `Officer account "${selectedOfficerForStatus.email}" has been ${actionLabel}.`,
        'success'
      );
      setIsStatusModalOpen(false);
      await loadOfficers();
    } catch (err) {
      setStatusError(err?.message || `Failed to update officer status.`);
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Handlers for Password Reset
  const handleOpenResetModal = (officer) => {
    setSelectedOfficerForReset(officer);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setResetError('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficerForReset) return;
    setResetError('');

    if (!resetNewPassword || resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters in length.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    try {
      setResetSubmitting(true);
      await officersApi.resetPassword(selectedOfficerForReset.userId, resetNewPassword);
      showToast(
        `Password for officer "${selectedOfficerForReset.email}" reset successfully.`,
        'success'
      );
      setIsResetModalOpen(false);
      await loadOfficers();
    } catch (err) {
      setResetError(err?.message || 'Failed to reset officer password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Check if target officer is the currently logged-in administrator
  const isCurrentAdmin = (officer) => {
    if (!user) return false;
    if (officer.userId && user.userId && officer.userId === user.userId) return true;
    if (officer.email && user.email && officer.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Officer Accounts
            </h1>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Provision and manage university placement officer accounts, login privileges, and credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadOfficers}
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
          >
            <UserPlus size={16} />
            <span>Provision Officer</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <MetricCard
          title="Total Officer Accounts"
          value={totalOfficers}
          icon={Shield}
          variant="primary"
          subtitle="Provisioned officers"
        />
        <MetricCard
          title="Active Officers"
          value={activeOfficers}
          icon={UserCheck}
          variant="success"
          subtitle="Authorized to log in"
        />
        <MetricCard
          title="Disabled Accounts"
          value={disabledOfficers}
          icon={UserX}
          variant={disabledOfficers > 0 ? 'danger' : 'default'}
          subtitle="Access suspended"
        />
      </div>

      {/* Main Content Card */}
      <Card>
        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by email or officer ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by account status"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DISABLED">Disabled Only</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Showing <strong>{filteredOfficers.length}</strong> of <strong>{totalOfficers}</strong> accounts
          </div>
        </div>

        {/* State Display: Loading, Error, Empty, or Table */}
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : error ? (

          <ErrorState
            title="Failed to Load Officers"
            message={error}
            onRetry={loadOfficers}
          />
        ) : filteredOfficers.length === 0 ? (
          <EmptyState
            title="No Officer Accounts Found"
            message={
              searchQuery || statusFilter !== 'ALL'
                ? 'No accounts match the current search filters. Try clearing your filters.'
                : 'No placement officer accounts have been provisioned yet. Click "Provision Officer" above to create the first account.'
            }
            action={
              (searchQuery || statusFilter !== 'ALL') ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenCreateModal}
                >
                  <UserPlus size={15} />
                  <span>Provision Officer</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>ID</th>
                  <th>Officer Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((officer) => {
                  const isCurrent = isCurrentAdmin(officer);
                  return (
                    <tr key={officer.userId}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          #{officer.userId}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Mail size={15} style={{ color: 'var(--color-text-muted)' }} />
                          <span style={{ fontWeight: 600 }}>{officer.email}</span>
                          {isCurrent && (
                            <span
                              className="badge badge-neutral"
                              style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                              title="Current Administrator Account"
                            >
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge badge-info"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 600,
                          }}
                        >
                          <Shield size={12} />
                          Placement Officer
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={officer.enabled ? 'ACTIVE' : 'DISABLED'} />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {formatDate(officer.createdAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isCurrent ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                              fontStyle: 'italic',
                            }}
                            title="Admins cannot modify their own account through this view"
                          >
                            Protected (Self)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            {/* Enable / Disable Button */}
                            <button
                              type="button"
                              className={`btn btn-sm ${officer.enabled ? 'btn-danger' : 'btn-secondary'}`}
                              onClick={() => handleOpenStatusModal(officer)}
                              title={officer.enabled ? 'Disable officer account' : 'Enable officer account'}
                              style={{ padding: '0.25rem 0.55rem' }}
                            >
                              {officer.enabled ? (
                                <>
                                  <UserX size={14} />
                                  <span>Disable</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck size={14} />
                                  <span>Enable</span>
                                </>
                              )}
                            </button>

                            {/* Reset Password Button */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenResetModal(officer)}
                              title="Reset officer password"
                              style={{ padding: '0.25rem 0.55rem' }}
                            >
                              <KeyRound size={14} />
                              <span>Reset Password</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 1. Create Placement Officer Modal                                         */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !createSubmitting && setIsCreateModalOpen(false)}
          title="Provision Placement Officer Account"
        >
          <form onSubmit={handleCreateSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Create a login account for an authorized campus placement officer. Public officer registration is strictly prohibited.
              </p>

              {createError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{createError}</span>
                </div>
              )}

              {/* Role Indicator Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-primary-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    System Role: ROLE_PLACEMENT_OFFICER
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    Assigned automatically server-side. Officers can post jobs, manage students, review applications, and record offers.
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="create-officer-email">
                  Officer Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    id="create-officer-email"
                    type="email"
                    className="form-input"
                    placeholder="officer@university.edu"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                    style={{ paddingLeft: '2.25rem' }}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="create-officer-password">
                  Initial Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    id="create-officer-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 8 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => setShowCreatePassword((prev) => !prev)}
                    title={showCreatePassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Must be at least 8 characters. Hashed via BCrypt before storage.
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="create-officer-confirm-password">
                  Confirm Initial Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    id="create-officer-confirm-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat initial password"
                    value={createConfirmPassword}
                    onChange={(e) => setCreateConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createSubmitting}
              >
                {createSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Provision Officer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 2. Enable / Disable Status Confirmation Modal                             */}
      {/* ========================================================================= */}
      {isStatusModalOpen && selectedOfficerForStatus && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => !statusSubmitting && setIsStatusModalOpen(false)}
          title={selectedOfficerForStatus.enabled ? 'Disable Officer Account' : 'Enable Officer Account'}
        >
          <div>
            {statusError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{statusError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: selectedOfficerForStatus.enabled
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(34, 197, 94, 0.12)',
                  color: selectedOfficerForStatus.enabled
                    ? 'var(--color-danger)'
                    : 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedOfficerForStatus.enabled ? <UserX size={22} /> : <UserCheck size={22} />}
              </div>

              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '0.95rem' }}>
                  {selectedOfficerForStatus.enabled
                    ? `Are you sure you want to disable officer account "${selectedOfficerForStatus.email}"?`
                    : `Are you sure you want to re-enable officer account "${selectedOfficerForStatus.email}"?`}
                </p>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {selectedOfficerForStatus.enabled ? (
                    <>
                      <strong>Security Impact:</strong> This placement officer will be immediately blocked from logging in. Any existing active JWT session tokens for this account will be rejected upon their next request.
                    </>
                  ) : (
                    <>
                      <strong>Access Restored:</strong> This placement officer will once again be able to log in and access administrative placement operations.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={statusSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${selectedOfficerForStatus.enabled ? 'btn-danger' : 'btn-success'}`}
                onClick={handleStatusSubmit}
                disabled={statusSubmitting}
              >
                {statusSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Updating...</span>
                  </>
                ) : selectedOfficerForStatus.enabled ? (
                  <>
                    <UserX size={15} />
                    <span>Confirm Disable</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={15} />
                    <span>Confirm Enable</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 3. Reset Officer Password Modal                                           */}
      {/* ========================================================================= */}
      {isResetModalOpen && selectedOfficerForReset && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => !resetSubmitting && setIsResetModalOpen(false)}
          title="Reset Officer Password"
        >
          <form onSubmit={handleResetSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Set a new password for placement officer <strong>{selectedOfficerForReset.email}</strong>.
              </p>

              {resetError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{resetError}</span>
                </div>
              )}

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="reset-officer-password">
                  New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    id="reset-officer-password"
                    type={showResetPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Minimum 8 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    title={showResetPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Minimum 8 characters. Hashed via BCrypt before saving.
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="reset-officer-confirm-password">
                  Confirm New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    id="reset-officer-confirm-password"
                    type={showResetPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Repeat new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsResetModalOpen(false)}
                disabled={resetSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={resetSubmitting}
              >
                {resetSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default OfficerAccountsPage;
