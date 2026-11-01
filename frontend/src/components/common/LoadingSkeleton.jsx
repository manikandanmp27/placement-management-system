import React from 'react';

export function SkeletonText({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: 'var(--radius-sm)' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="table-container" aria-busy="true" aria-label="Loading data">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <SkeletonText width={i === 0 ? '50%' : '75%'} height="0.875rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <SkeletonText width={c === 0 ? '45%' : c === cols - 1 ? '30%' : '80%'} height="1rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonMetricsGrid({ count = 4 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}
      aria-busy="true"
      aria-label="Loading metrics"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="metric-card">
          <div className="metric-card-top">
            <SkeletonText width="55%" height="0.75rem" />
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)' }} />
          </div>
          <SkeletonText width="40%" height="2rem" />
        </div>
      ))}
    </div>
  );
}

export default {
  SkeletonText,
  SkeletonTable,
  SkeletonMetricsGrid,
};
