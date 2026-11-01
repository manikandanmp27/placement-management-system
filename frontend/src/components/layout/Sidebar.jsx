import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  FileText,
  CalendarClock,
  Award,
  BarChart3,
  FileBarChart,
  ShieldCheck,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STUDENT_NAV_GROUPS = [
  {
    title: 'Overview',
    items: [{ path: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'My Placement Journey',
    items: [
      { path: '/my-profile', label: 'My Profile', icon: UserCircle },
      { path: '/my-applications', label: 'My Applications', icon: FileText },
      { path: '/my-interviews', label: 'My Interviews', icon: CalendarClock },
      { path: '/my-placement', label: 'My Placement', icon: Award },
    ],
  },
  {
    title: 'Explore',
    items: [
      { path: '/jobs', label: 'Jobs', icon: ClipboardList },
      { path: '/companies', label: 'Companies', icon: Briefcase },
      { path: '/statistics', label: 'Statistics', icon: BarChart3 },
    ],
  },
];

const OFFICER_NAV_GROUPS = [
  {
    title: 'Overview',
    items: [{ path: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Records',
    items: [
      { path: '/students', label: 'Students', icon: Users },
      { path: '/departments', label: 'Departments', icon: Building2 },
      { path: '/companies', label: 'Companies', icon: Briefcase },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { path: '/jobs', label: 'Jobs', icon: ClipboardList },
      { path: '/applications', label: 'Applications', icon: FileText },
      { path: '/interviews', label: 'Interviews', icon: CalendarClock },
      { path: '/placements', label: 'Placements', icon: Award },
    ],
  },
  {
    title: 'Insights',
    items: [
      { path: '/statistics', label: 'Statistics', icon: BarChart3 },
      { path: '/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
];

const ADMIN_EXTRA_GROUPS = [
  {
    title: 'Administration',
    items: [{ path: '/officers', label: 'Officer Accounts', icon: ShieldCheck }],
  },
];

function formatRole(role) {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Administrator';
    case 'ROLE_PLACEMENT_OFFICER':
      return 'Placement Officer';
    case 'ROLE_STUDENT':
      return 'Student Candidate';
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

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const { user, logout, isStudent, isAdmin } = useAuth();

  const navGroups = isStudent
    ? STUDENT_NAV_GROUPS
    : isAdmin
    ? [...OFFICER_NAV_GROUPS, ...ADMIN_EXTRA_GROUPS]
    : OFFICER_NAV_GROUPS;

  const initials = getInitials(user?.email);

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
        aria-label="Primary Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="brand-icon-box" aria-hidden="true">
              <GraduationCap size={18} strokeWidth={1.75} />
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
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={16} strokeWidth={1.75} />
            ) : (
              <ChevronLeft size={16} strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="sidebar-nav" aria-label="Main Menu">
          {navGroups.map((group, idx) => (
            <div key={group.title || idx} className="nav-group">
              {!isCollapsed ? (
                <div className="nav-section-title">{group.title}</div>
              ) : (
                idx > 0 && <div className="nav-group-divider" aria-hidden="true" />
              )}

              {group.items.map((item) => {
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
                    aria-label={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} strokeWidth={1.75} className="nav-icon" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile & Sign Out */}
        <div className="sidebar-footer">
          <div
            className="profile-card"
            title={isCollapsed ? `${user?.email || 'User'} (${formatRole(user?.role)})` : undefined}
          >
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="profile-info">
                <span className="profile-name" title={user?.email || 'User'}>
                  {user?.email || 'Authenticated User'}
                </span>
                <span className="profile-role">{formatRole(user?.role)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={logout}
            title="Sign out of CampusHire"
            aria-label="Sign out"
            style={{
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: 'var(--color-sidebar-text-muted)',
              padding: '0 0.5rem',
            }}
          >
            <LogOut size={16} strokeWidth={1.75} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
