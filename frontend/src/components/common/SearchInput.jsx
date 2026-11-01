import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search records...',
  className = '',
  id,
}) {
  return (
    <div className={`search-input-wrap ${className}`.trim()} role="search">
      <Search size={16} strokeWidth={1.75} className="search-input-icon" aria-hidden="true" />
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search query"
          title="Clear search"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
