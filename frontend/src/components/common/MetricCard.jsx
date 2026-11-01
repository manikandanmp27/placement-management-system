import React from 'react';

export function MetricCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
  context,
  trend,
  className = '',
  compact = false,
  lead = false,
  children,
}) {
  const isCompact = compact || variant === 'compact';
  const isLead = lead || variant === 'lead';

  return (
    <div
      className={`metric-card ${isCompact ? 'compact' : ''} ${isLead ? 'lead' : ''} ${className}`.trim()}
    >
      <div className="metric-card-top">
        <span className="metric-card-label">{title}</span>
        {Icon && (
          <div className={`metric-card-icon-wrap ${variant}`} aria-hidden="true">
            <Icon size={isCompact ? 16 : 18} strokeWidth={1.75} />
          </div>
        )}
      </div>

      <div className="metric-card-value">
        {value !== undefined && value !== null ? value : '—'}
      </div>

      {(subtitle || context || trend || children) && (
        <div className="metric-card-meta">
          {trend && <span style={{ fontWeight: 600 }}>{trend}</span>}
          {(context || subtitle) && <span>{context || subtitle}</span>}
          {children}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
