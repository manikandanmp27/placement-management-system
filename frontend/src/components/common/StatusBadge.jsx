import React from 'react';

export function StatusBadge({ status, label: customLabel, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let variant = 'neutral';
  let label = customLabel || status;

  if (normalized === 'PLACED') {
    variant = 'success';
    label = customLabel || 'Placed';
  } else if (normalized === 'NOT_PLACED') {
    variant = 'neutral';
    label = customLabel || 'Not Placed';
  } else if (normalized === 'APPLIED') {
    variant = 'info';
    label = customLabel || 'Applied';
  } else if (normalized === 'SHORTLISTED') {
    variant = 'warning';
    label = customLabel || 'Shortlisted';
  } else if (normalized === 'SELECTED') {
    variant = 'success';
    label = customLabel || 'Selected';
  } else if (normalized === 'REJECTED') {
    variant = 'danger';
    label = customLabel || 'Rejected';
  } else if (normalized === 'PASSED') {
    variant = 'success';
    label = customLabel || 'Passed';
  } else if (normalized === 'PENDING') {
    variant = 'warning';
    label = customLabel || 'Pending';
  } else if (normalized === 'FAILED') {
    variant = 'danger';
    label = customLabel || 'Failed';
  } else if (normalized === 'ACTIVE') {
    variant = 'success';
    label = customLabel || 'Active';
  } else if (normalized === 'DISABLED') {
    variant = 'danger';
    label = customLabel || 'Disabled';
  } else if (normalized === 'EXPIRED') {
    variant = 'danger';
    label = customLabel || 'Expired';
  } else if (normalized === 'ARCHIVED') {
    variant = 'neutral';
    label = customLabel || 'Archived';
  }

  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      <span className="badge-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * CategoryTag is visually distinct from StatusBadge:
 * It has an outline border, transparent background, no dot, and 6px border radius.
 * Used for non-status categories like Round Type, Job Type, Department, Industry.
 */
export function CategoryTag({ children, label, className = '' }) {
  const content = children || label;
  if (!content) return null;
  return (
    <span className={`category-tag ${className}`.trim()}>
      {content}
    </span>
  );
}

export default StatusBadge;
