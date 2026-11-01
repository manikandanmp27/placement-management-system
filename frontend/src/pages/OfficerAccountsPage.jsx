import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  UserX,
  UserCheck,
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

import MetricCard from '../components/common/MetricCard';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge, { CategoryTag } from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { SkeletonTable } from '../components/common/LoadingSkeleton';
import { formatDate } from '../utils/formatters';

export function OfficerAccountsPage() {
  const { user } = useAuth();
  const toast = useToast();

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

  // Status Change (Enable / Disable) Confirm Dialog State
  const [officerToToggleStatus, setOfficerToToggleStatus] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

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
      console.error('Failed to load officer accounts:', err);
      setError(err?.message || 'Failed to load officer accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfficers();
  }, [loadOfficers]);

  // Filtered officers
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

  // Derived metrics for governance strip
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
    if (e) e.preventDefault();
    setCreateError('');

    const normalizedEmail = createEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setCreateError('Officer email address is required.');
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

      toast.success(`Placement officer account for "${newOfficer.email}" created successfully.`);
      setIsCreateModalOpen(false);
      await loadOfficers();
    } catch (err) {
      console.error('Failed to provision officer:', err);
      setCreateError(err?.message || 'Failed to provision officer account.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handlers for Status Change (Enable / Disable) via ConfirmDialog
  const handleConfirmToggleStatus = async () => {
    if (!officerToToggleStatus) return;

    const newStatus = !officerToToggleStatus.enabled;
    const actionLabel = newStatus ? 'enabled' : 'disabled';

    try {
      setStatusSubmitting(true);
      await officersApi.updateStatus(officerToToggleStatus.userId, newStatus);
      toast.success(`Officer account "${officerToToggleStatus.email}" has been ${actionLabel}.`);
      setOfficerToToggleStatus(null);
      await loadOfficers();
    } catch (err) {
      console.error('Failed to update officer status:', err);
      toast.error(err?.message || `Failed to update officer status.`);
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
    if (e) e.preventDefault();
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
      toast.success(`Password for officer "${selectedOfficerForReset.email}" reset successfully.`);
      setIsResetModalOpen(false);
      await loadOfficers();
    } catch (err) {
      console.error('Failed to reset password:', err);
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
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Officer Accounts</h1>
          <p className="page-subtitle">
            Provision and govern university placement officer accounts, access privileges, and security credentials.
          </p>
        </div>

        <div className="page-header-actions">
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

          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenCreateModal}
            id="btn-provision-officer"
          >
            Provision Officer
          </Button>
        </div>
      </div>

      {/* Governance Strip (Compact Metrics) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <MetricCard
          title="Total Officer Accounts"
          value={totalOfficers}
          icon={Shield}
          variant="primary"
          subtitle="Provisioned officer accounts"
        />
        <MetricCard
          title="Active Officers"
          value={activeOfficers}
          icon={UserCheck}
          variant="success"
          subtitle="Authorized to sign in"
        />
        <MetricCard
          title="Disabled Accounts"
          value={disabledOfficers}
          icon={UserX}
          variant={disabledOfficers > 0 ? 'warning' : 'default'}
          subtitle="Access suspended"
        />
      </div>

      {/* Main Content Card */}
      <div className="card">
        {/* FilterBar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', flex: 1, minWidth: '260px' }}>
            <div style={{ flex: 1, minWidth: '220px', maxWidth: '400px' }}>
              <SearchInput
                placeholder="Search by email or officer ID..."
                value={searchQuery}
                onChange={setSearchQuery}
                id="officer-search-input"
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by account status"
                id="officer-status-filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="DISABLED">Disabled Only</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filteredOfficers.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{totalOfficers}</strong> accounts
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
            icon={Shield}
            title={searchQuery || statusFilter !== 'ALL' ? 'No matching officer accounts' : 'No officer accounts'}
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'No accounts match the current search filters.'
                : 'No placement officer accounts have been provisioned yet.'
            }
            actionText={!(searchQuery || statusFilter !== 'ALL') ? 'Provision Officer' : undefined}
            actionIcon={UserPlus}
            onAction={!(searchQuery || statusFilter !== 'ALL') ? handleOpenCreateModal : undefined}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th style={{ minWidth: '240px' }}>Officer Email</th>
                  <th style={{ width: '150px' }}>Role</th>
                  <th className="col-status" style={{ width: '130px', textAlign: 'center' }}>Status</th>
                  <th className="col-date" style={{ width: '140px' }}>Created Date</th>
                  <th className="col-actions" style={{ textAlign: 'right', width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((officer) => {
                  const isCurrent = isCurrentAdmin(officer);
                  return (
                    <tr key={officer.userId}>
                      {/* ID */}
                      <td style={{ width: '80px', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        #{officer.userId}
                      </td>

                      {/* Email + Self Tag */}
                      <td style={{ minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Mail size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{officer.email}</span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-primary-100)',
                                color: 'var(--color-primary-700)',
                              }}
                              title="Current Administrator Session"
                            >
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ width: '150px' }}>
                        <CategoryTag label="Placement Officer" />
                      </td>

                      {/* Status */}
                      <td className="col-status" style={{ width: '130px', textAlign: 'center' }}>
                        <StatusBadge status={officer.enabled ? 'ACTIVE' : 'DISABLED'} />
                      </td>

                      {/* Created Date */}
                      <td className="col-date" style={{ width: '140px', fontSize: 'var(--text-xs)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {formatDate(officer.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="col-actions" style={{ width: '220px', textAlign: 'right' }}>
                        {isCurrent ? (
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--color-text-muted)',
                              fontStyle: 'italic',
                            }}
                            title="Administrators cannot modify their own status through this view"
                          >
                            Protected (Self)
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            {/* Reset Password Button */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenResetModal(officer)}
                              title="Reset officer password"
                              id={`btn-reset-officer-${officer.userId}`}
                            >
                              <KeyRound size={14} />
                              <span>Reset Password</span>
                            </button>

                            {/* Enable / Disable Button */}
                            <button
                              type="button"
                              className={`btn btn-sm ${officer.enabled ? 'btn-ghost text-danger' : 'btn-secondary'}`}
                              onClick={() => setOfficerToToggleStatus(officer)}
                              title={officer.enabled ? 'Disable officer account' : 'Enable officer account'}
                              id={`btn-status-officer-${officer.userId}`}
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
      </div>

      {/* ========================================================================= */}
      {/* 1. Create Placement Officer Modal                                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createSubmitting && setIsCreateModalOpen(false)}
        title="Provision Placement Officer Account"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={createSubmitting}
              id="submit-provision-officer-btn"
            >
              Provision Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Create a login account for an authorized campus placement officer. Public officer self-registration is strictly prohibited.
            </p>

            {createError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger-text)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{createError}</span>
              </div>
            )}

            {/* Role Notice */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <ShieldCheck size={20} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
              <div style={{ fontSize: 'var(--text-xs)' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Assigned Role: ROLE_PLACEMENT_OFFICER
                </div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  Officers can post drives, manage student records, review applications, and record placements.
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="create-officer-email">
                Officer Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
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
                  style={{ paddingLeft: '2.5rem' }}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="create-officer-password">
                Initial Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
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
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => setShowCreatePassword((prev) => !prev)}
                  title={showCreatePassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 'var(--space-2)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Must be at least 8 characters. Securely hashed via BCrypt before storage.
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="create-officer-confirm-password">
                Confirm Initial Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
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
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Enable / Disable Status ConfirmDialog                                  */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!officerToToggleStatus}
        onClose={() => setOfficerToToggleStatus(null)}
        onConfirm={handleConfirmToggleStatus}
        title={officerToToggleStatus?.enabled ? 'Disable Officer Account' : 'Enable Officer Account'}
        message={
          officerToToggleStatus?.enabled
            ? `Are you sure you want to disable officer account "${officerToToggleStatus?.email}"? Security Impact: They will be immediately blocked from signing in; any active JWT sessions are revoked.`
            : `Are you sure you want to re-enable officer account "${officerToToggleStatus?.email}"? Access Restored: This placement officer will once again be able to sign in and perform placement tasks.`
        }
        confirmText={officerToToggleStatus?.enabled ? 'Disable Account' : 'Enable Account'}
        variant={officerToToggleStatus?.enabled ? 'danger' : 'primary'}
        isLoading={statusSubmitting}
      />

      {/* ========================================================================= */}
      {/* 3. Reset Officer Password Modal                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => !resetSubmitting && setIsResetModalOpen(false)}
        title="Reset Officer Password"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsResetModalOpen(false)}
              disabled={resetSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResetSubmit}
              isLoading={resetSubmitting}
              id="submit-reset-password-btn"
            >
              Reset Password
            </Button>
          </>
        }
      >
        <form onSubmit={handleResetSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Set a new security password for placement officer <strong>{selectedOfficerForReset?.email}</strong>.
            </p>

            {resetError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-danger-text)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            {/* New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-officer-password">
                New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
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
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => setShowResetPassword((prev) => !prev)}
                  title={showResetPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 'var(--space-2)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Minimum 8 characters. Hashed via BCrypt before saving.
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-officer-confirm-password">
                Confirm New Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-3)',
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
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default OfficerAccountsPage;
