import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria or currently recorded in the system.',
  actionText,
  actionIcon,
  onAction,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={36} strokeWidth={1.75} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
