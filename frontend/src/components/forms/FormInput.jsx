import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function FormInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  step,
  min,
  max,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="form-required" aria-hidden="true">*</span>}
        </label>
      )}

      {isPassword ? (
        <div className="input-password-wrap">
          <input
            type={resolvedType}
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            aria-required={required}
            disabled={disabled}
            className={`form-input ${error ? 'error' : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            tabIndex={-1}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
          </button>
        </div>
      ) : (
        <input
          type={resolvedType}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-required={required}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          className={`form-input ${error ? 'error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />
      )}

      {error && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          <AlertCircle size={14} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </span>
      )}

      {!error && helpText && (
        <span id={`${inputId}-help`} className="form-help">
          {helpText}
        </span>
      )}
    </div>
  );
}

export default FormInput;
