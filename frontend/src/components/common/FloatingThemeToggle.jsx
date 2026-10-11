import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function FloatingThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  const tooltipText = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      className="floating-theme-toggle"
      onClick={toggleTheme}
      aria-label={tooltipText}
      title={tooltipText}
      id="floating-theme-switch-btn"
    >
      {isDark ? (
        <Sun size={20} style={{ color: '#FBBF24' }} />
      ) : (
        <Moon size={20} style={{ color: '#3B5BDB' }} />
      )}
      <span className="floating-theme-tooltip" role="tooltip">
        {tooltipText}
      </span>
    </button>
  );
}

export default FloatingThemeToggle;
