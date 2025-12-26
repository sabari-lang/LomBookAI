import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Main Layout for Logistics Reports
 * Reports navigation is handled by the main sidebar (Logistics Report submenu)
 * This layout only provides the content area without duplicate navigation
 */
const ReportsLayout = () => {

  return (
    <div style={{ minHeight: 'calc(100vh - 12vh)' }}>
      {/* Content Area - Removed duplicate sidebar menu; navigation is handled by main sidebar */}
      <main className="w-100 " style={{ overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default ReportsLayout;

