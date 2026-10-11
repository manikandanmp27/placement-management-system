import React from 'react';

export function StatusBadge({ status, type = 'default' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let variant = 'neutral';
  let label = status;

  if (normalized === 'PLACED') {
    variant = 'success';
    label = 'Placed';
  } else if (normalized === 'NOT_PLACED') {
    variant = 'neutral';
    label = 'Not Placed';
  }
  
  else if (normalized === 'APPLIED') {
    variant = 'info';
    label = 'Applied';
  } else if (normalized === 'SHORTLISTED') {
    variant = 'warning';
    label = 'Shortlisted';
  } else if (normalized === 'SELECTED') {
    variant = 'success';
    label = 'Selected';
  } else if (normalized === 'REJECTED') {
    variant = 'danger';
    label = 'Rejected';
  }
  
  else if (normalized === 'PASSED') {
    variant = 'success';
    label = 'Passed';
  } else if (normalized === 'PENDING') {
    variant = 'warning';
    label = 'Pending';
  } else if (normalized === 'FAILED') {
    variant = 'danger';
    label = 'Failed';
  }
  
  else if (normalized === 'ACTIVE') {
    variant = 'success';
    label = 'Active';
  } else if (normalized === 'EXPIRED') {
    variant = 'danger';
    label = 'Expired';
  }

  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

export default StatusBadge;
