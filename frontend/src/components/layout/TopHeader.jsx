import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Sparkles, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const PAGE_METADATA = {
  '/': { title: 'Dashboard', section: 'Overview' },
  '/students': { title: 'Students', section: 'Records' },
  '/departments': { title: 'Departments', section: 'Records' },
  '/companies': { title: 'Companies', section: 'Records' },
  '/jobs': { title: 'Jobs', section: 'Recruitment' },
  '/applications': { title: 'Applications', section: 'Recruitment' },
  '/interviews': { title: 'Interviews', section: 'Recruitment' },
  '/placements': { title: 'Placements', section: 'Recruitment' },
  '/statistics': { title: 'Statistics', section: 'Insights' },
  '/reports': { title: 'Reports', section: 'Insights' },
  '/officers': { title: 'Officer Accounts', section: 'Administration' },
  '/my-profile': { title: 'My Profile', section: 'My Placement Journey' },
  '/my-applications': { title: 'My Applications', section: 'My Placement Journey' },
  '/my-interviews': { title: 'My Interviews', section: 'My Placement Journey' },
  '/my-placement': { title: 'My Placement', section: 'My Placement Journey' },
};

function formatRoleShort(role) {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Admin';
    case 'ROLE_PLACEMENT_OFFICER':
      return 'Officer';
    case 'ROLE_STUDENT':
      return 'Student';
    default:
      return 'User';
  }
}

function getInitials(email = '') {
  if (!email) return 'U';
  const namePart = email.split('@')[0];
  const parts = namePart.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return namePart.slice(0, 2).toUpperCase();
}

export function TopHeader({ onOpenMobile }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const currentMeta = PAGE_METADATA[location.pathname] || {
    title: 'Portal',
    section: 'CampusHire',
  };

  const initials = getInitials(user?.email);

  useEffect(() => {
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsAccountOpen(false);
      }
    }
    if (isAccountOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountOpen]);

  return (
    <header className="top-header" role="banner">
      <div className="header-left">
        <button
          type="button"
          className="header-hamburger-btn icon-btn"
          onClick={onOpenMobile}
          aria-label="Open navigation drawer"
          title="Open menu"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        <div className="header-title-block">
          <nav className="breadcrumbs" aria-label="Breadcrumb navigation">
            <Link to="/" className="breadcrumb-item">Home</Link>
            <ChevronRight size={12} className="breadcrumb-sep" aria-hidden="true" />
            <span className="breadcrumb-item">{currentMeta.section}</span>
            <ChevronRight size={12} className="breadcrumb-sep" aria-hidden="true" />
            <span className="breadcrumb-current" aria-current="page">{currentMeta.title}</span>
          </nav>
        </div>
      </div>

      <div className="header-right">
        {/* Active Season Chip (hidden on mobile) */}
        <div className="season-chip" aria-label="Current Placement Season">
          <Sparkles size={13} strokeWidth={1.75} aria-hidden="true" />
          <span>Active Season 2026–27</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun size={17} strokeWidth={1.75} style={{ color: 'var(--color-warning)' }} />
          ) : (
            <Moon size={17} strokeWidth={1.75} style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>

        {/* Role Badge (Outlined Category Tag) */}
        {user?.role && (
          <span className="category-tag" title={user.email}>
            {formatRoleShort(user.role)}
          </span>
        )}

        {/* User Account Popover Menu */}
        {user && (
          <div className="account-menu-container" ref={accountRef}>
            <button
              type="button"
              className="account-trigger-btn"
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              aria-expanded={isAccountOpen}
              aria-haspopup="true"
              aria-label="Open account menu"
              title={user.email}
            >
              <div className="account-avatar-circle" aria-hidden="true">
                {initials}
              </div>
            </button>

            {isAccountOpen && (
              <div className="account-dropdown-popover" role="menu">
                <div className="account-dropdown-header">
                  <span className="account-dropdown-email" title={user.email}>
                    {user.email}
                  </span>
                  <span className="account-dropdown-role">
                    {formatRoleShort(user.role)} Account
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setIsAccountOpen(false);
                    logout();
                  }}
                  role="menuitem"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                >
                  <LogOut size={15} strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default TopHeader;
