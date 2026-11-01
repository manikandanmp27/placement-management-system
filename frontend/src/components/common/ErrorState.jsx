import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export function ErrorState({
  title = 'Failed to load records',
  message = 'An unexpected error occurred while communicating with the backend server.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        padding: 'var(--space-8) var(--space-6)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: '4px solid var(--color-danger)',
      }}
      role="alert"
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
        }}
        aria-hidden="true"
      >
        <AlertCircle size={28} strokeWidth={1.75} />
      </div>

      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>
        {title}
      </h3>

      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '420px', margin: '0 0 var(--space-4)', lineHeight: 1.5 }}>
        {message}
      </p>

      {onRetry && (
        <Button variant="outline-primary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', margin: 'var(--space-3) 0 0' }}>
        If this issue persists, please contact the campus placement office.
      </p>
    </div>
  );
}

export default ErrorState;
