import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, ChevronRight, Bell, Sparkles } from 'lucide-react';

const PAGE_METADATA = {
  '/': { title: 'Dashboard', section: 'Overview' },
  '/students': { title: 'Students Directory', section: 'Academics' },
  '/companies': { title: 'Partner Companies', section: 'Corporate Relations' },
  '/jobs': { title: 'Job Openings', section: 'Recruitment' },
  '/applications': { title: 'Student Applications', section: 'Recruitment' },
  '/interviews': { title: 'Interview Schedules', section: 'Recruitment' },
  '/placements': { title: 'Placement Records', section: 'Outcomes' },
  '/statistics': { title: 'Placement Statistics', section: 'Analytics' },
};

export function TopHeader({ onOpenMobile }) {
  const location = useLocation();
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
      </div>
    </header>
  );
}

export default TopHeader;
