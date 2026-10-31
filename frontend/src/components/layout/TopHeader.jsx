import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Sparkles, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_METADATA = {
  '/': { title: 'Dashboard', section: 'Overview' },
  '/departments': { title: 'Department Management', section: 'Academics' },
  '/students': { title: 'Students Directory', section: 'Academics' },
  '/companies': { title: 'Partner Companies', section: 'Corporate Relations' },
  '/jobs': { title: 'Job Openings', section: 'Recruitment' },
  '/applications': { title: 'Student Applications', section: 'Recruitment' },
  '/interviews': { title: 'Interview Schedules', section: 'Recruitment' },
  '/placements': { title: 'Placement Records', section: 'Outcomes' },
  '/statistics': { title: 'Placement Statistics', section: 'Analytics' },
  '/reports': { title: 'Placement Reports & Analytics', section: 'Analytics' },
  '/my-applications': { title: 'My Applications', section: 'Student Portal' },
  '/my-interviews': { title: 'My Interviews', section: 'Student Portal' },
  '/my-placement': { title: 'My Placement Status', section: 'Student Portal' },
  '/my-profile': { title: 'My Profile', section: 'Student Portal' },
  '/officers': { title: 'Officer Accounts', section: 'Administration' },
};


function formatRole(role) {
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

export function TopHeader({ onOpenMobile }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentMeta = PAGE_METADATA[location.pathname] || {
    title: 'Portal',
    section: 'Placement Office',
  };

  return (
    <header className="top-header" role="banner">
      <div className="header-left">
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          style={{ display: 'none' }}
          id="mobile-menu-trigger"
        >
          <Menu size={20} />
        </button>

        <style>{`
          @media (max-width: 900px) {
            #mobile-menu-trigger {
              display: inline-flex !important;
            }
          }
        `}</style>

        <div className="header-title-block">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-item">Home</Link>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <span className="breadcrumb-item">{currentMeta.section}</span>
            <ChevronRight size={12} className="breadcrumb-sep" />
            <span className="breadcrumb-current">{currentMeta.title}</span>
          </nav>
          <h1 className="page-title">{currentMeta.title}</h1>
        </div>
      </div>

      <div className="header-right">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} />
          <span>Active Season 2026–27</span>
        </div>

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              className="badge badge-info"
              style={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                padding: '0.3rem 0.6rem',
              }}
              title={user.email}
            >
              <Shield size={12} />
              {formatRole(user.role)}
            </span>

            <button
              type="button"
              className="icon-btn icon-btn-sm"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopHeader;

