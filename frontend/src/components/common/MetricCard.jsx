import React from 'react';

export function MetricCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
  trend,
  className = '',
}) {
  return (
    <div className={`metric-card ${className}`.trim()}>
      <div className="metric-card-top">
        <span className="metric-card-label">{title}</span>
        {Icon && (
          <div className={`metric-card-icon-wrap ${variant}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="metric-card-value">
        {value !== undefined && value !== null ? value : '—'}
      </div>

      {(subtitle || trend) && (
        <div className="metric-card-meta">
          {trend && <span style={{ fontWeight: 600 }}>{trend}</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
