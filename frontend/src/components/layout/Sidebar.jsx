import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: GraduationCap },
  { path: '/companies', label: 'Companies', icon: Building2 },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/applications', label: 'Applications', icon: FileText },
  { path: '/interviews', label: 'Interviews', icon: CalendarCheck },
  { path: '/placements', label: 'Placements', icon: Award },
  { path: '/statistics', label: 'Placement Statistics', icon: BarChart3 },
];

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  return (
    <>
      
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Main Navigation"
      >
        
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="brand-icon-box">
              <GraduationCap size={22} />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">CampusHire</span>
                <span className="brand-subtitle">Placement Portal</span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ color: 'var(--color-sidebar-text-muted)' }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && (
            <div className="nav-section-title">Navigation</div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={19} className="nav-icon" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card" title={isCollapsed ? 'Placement Officer (Admin)' : undefined}>
            <div className="profile-avatar">
              <ShieldCheck size={18} />
            </div>
            {!isCollapsed && (
              <div className="profile-info">
                <span className="profile-name">Placement Cell</span>
                <span className="profile-role">Admin Officer</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
