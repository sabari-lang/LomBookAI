import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart } from 'react-bootstrap-icons';
import { allReports } from '../config/reportDefinitions';

/**
 * Main Layout for Logistics Reports
 * Provides left sidebar navigation and right content area
 */
const ReportsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current active report based on path (handle both /reports/clearance-pending and full paths)
  const currentPath = location.pathname;
  const currentReport = allReports.find((r) => currentPath.includes(r.path.split('/').pop()));

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 12vh)' }}>
      {/* Left Sidebar */}
      <aside
        className="bg-dark text-white"
        style={{
          width: '280px',
          minHeight: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="p-2 border-bottom border-secondary"
          style={{ backgroundColor: '#2c3e50' }}
        >
          <div className="d-flex align-items-center gap-2">
            <BarChart size={20} />
            <h6 className="mb-0 fw-bold">Reports</h6>
          </div>
        </div>

        {/* Report List */}
        <div className="p-1">
          {allReports.map((report) => {
            const isActive = location.pathname === report.path;

            return (
              <div
                key={report.id}
                onClick={() => navigate(report.path)}
                className={`p-3 mb-1 rounded-0 cursor-pointer ${isActive ? 'bg-primary' : 'hover-bg-secondary'
                  }`}
                style={{
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: isActive ? '#0d6efd' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="d-flex align-items-center">
                  <input
                    type="radio"
                    checked={isActive}
                    onChange={() => { }}
                    className="me-2"
                    style={{ cursor: 'pointer' }}
                  />
                  <span className={`${isActive ? 'tw-font-bold tw-text-lg tw-text-sm' : 'tw-text-sm'}`}>
                    {report.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-grow-1 bg-light" style={{ overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default ReportsLayout;

