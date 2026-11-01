import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  captionPrefix = 'Showing',
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis: show 1, last, and current ± 1
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const leftBound = Math.max(2, currentPage - 1);
    const rightBound = Math.min(totalPages - 1, currentPage + 1);

    pages.push(1);

    if (leftBound > 2) {
      pages.push('...');
    }

    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }

    if (rightBound < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <nav className="pagination" aria-label="Pagination Navigation">
      <div className="pagination-info" aria-live="polite">
        {captionPrefix}{' '}
        <strong>
          {startItem}–{endItem}
        </strong>{' '}
        of <strong>{totalItems}</strong> records
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>

        {getPageNumbers().map((item, idx) =>
          item === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              style={{ padding: '0 6px', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={`page-${item}`}
              type="button"
              className={`pagination-btn ${item === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
              aria-label={`Page ${item}`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          title="Next page"
        >
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
