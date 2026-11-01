import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action?',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false,
  isBlocked = false,
  blockedReason = '',
}) {
  const isDanger = confirmVariant === 'danger';

  const renderIcon = () => {
    if (isDanger) {
      return (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <AlertCircle size={22} strokeWidth={1.75} />
        </div>
      );
    }
    if (confirmVariant === 'warning') {
      return (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={22} strokeWidth={1.75} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-info-bg)',
          color: 'var(--color-info)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Info size={22} strokeWidth={1.75} />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isBlocked || isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {renderIcon()}
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>

          {isBlocked && blockedReason && (
            <div className="alert alert-warning" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)' }} role="alert">
              <AlertTriangle size={16} strokeWidth={1.75} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Action unavailable: </strong>
                {blockedReason}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
