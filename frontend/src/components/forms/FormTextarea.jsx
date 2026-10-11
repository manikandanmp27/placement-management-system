import React from 'react';

export function FormTextarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  rows = 3,
  className = '',
  ...props
}) {
  const textareaId = id || name;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`form-textarea ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined}
        {...props}
      />

      {error && (
        <span id={`${textareaId}-error`} className="form-error">
          {error}
        </span>
      )}

      {!error && helpText && (
        <span id={`${textareaId}-help`} className="form-help">
          {helpText}
        </span>
      )}
    </div>
  );
}

export default FormTextarea;
