import React from 'react';

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  bordered = false,
  className = '',
  onClick,
  ...props
}) {
  const sizeClass = size === 'sm' ? 'icon-btn-sm' : '';
  const borderClass = bordered ? 'icon-btn-bordered' : '';

  return (
    <button
      type="button"
      className={`icon-btn ${sizeClass} ${borderClass} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      <Icon size={size === 'sm' ? 14 : 18} />
    </button>
  );
}

export default IconButton;
