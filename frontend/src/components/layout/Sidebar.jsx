import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Building,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck,
  Award,
  BarChart3,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const OFFICER_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/students', label: 'Students', icon: GraduationCap },
  { path: '/departments', label: 'Departments', icon: Building },
  { path: '/companies', label: 'Companies', icon: Building2 },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/applications', label: 'Applications', icon: FileText },
  { path: '/interviews', label: 'Interviews', icon: CalendarCheck },
  { path: '/placements', label: 'Placements', icon: Award },
  { path: '/statistics', label: 'Placement Statistics', icon: BarChart3 },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
];


const ADMIN_EXTRA_NAV_ITEMS = [
  { path: '/officers', label: 'Officer Accounts', icon: ShieldCheck },
];

const STUDENT_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/my-applications', label: 'My Applications', icon: FileText },
  { path: '/my-interviews', label: 'My Interviews', icon: CalendarCheck },
  { path: '/my-placement', label: 'My Placement', icon: Award },
  { path: '/my-profile', label: 'My Profile', icon: User },
  { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
  { path: '/companies', label: 'Partner Companies', icon: Building2 },
  { path: '/statistics', label: 'Placement Statistics', icon: BarChart3 },
];

function formatRole(role) {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Admin';
    case 'ROLE_PLACEMENT_OFFICER':
      return 'Placement Officer';
    case 'ROLE_STUDENT':
      return 'Student';
    default:
      return 'User';
  }
}

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();

  const isStudent = user?.role === 'ROLE_STUDENT';
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const visibleNavItems = isStudent
    ? STUDENT_NAV_ITEMS
    : isAdmin
    ? [...OFFICER_NAV_ITEMS, ...ADMIN_EXTRA_NAV_ITEMS]
    : OFFICER_NAV_ITEMS;


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
            <div className="nav-section-title">
              {isStudent ? 'Student Portal' : isAdmin ? 'Admin Console' : 'Navigation'}
            </div>
          )}


          {visibleNavItems.map((item) => {
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
          <div
            className="profile-card"
            title={isCollapsed ? `${user?.email || 'User'} (${formatRole(user?.role)})` : undefined}
          >
            <div className="profile-avatar">
              {user?.role === 'ROLE_STUDENT' ? <User size={18} /> : <ShieldCheck size={18} />}
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
            title="Sign Out"
            style={{
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              color: 'var(--color-sidebar-text-muted)',
              padding: '0.45rem 0.65rem',
            }}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

