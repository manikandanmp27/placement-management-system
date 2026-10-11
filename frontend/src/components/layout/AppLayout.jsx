import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import FloatingThemeToggle from '../common/FloatingThemeToggle';

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-wrapper">
        <TopHeader onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <FloatingThemeToggle />
    </div>
  );
}

export default AppLayout;
