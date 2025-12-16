import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * Bulk Actions Bar Component
 * Provides bulk update operations and export options
 */
const BulkActionsBar = ({
  reportConfig = {},
  selectedRows = new Set(),
  onBulkStatusUpdate = () => {},
  onBulkDateUpdate = () => {},
  onExportPdf = () => {},
  onExportCsv = () => {},
  columns = [],
  onColumnVisibilityChange = () => {},
  loading = false,
  showExport = true,
}) => {
  const [bulkStatus, setBulkStatus] = useState('All');
  const [bulkDateField, setBulkDateField] = useState('All');
  const [bulkDate, setBulkDate] = useState(null);

  // Get status options (TODO: fetch from API or config)
  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    // TODO: Add all status options from spec
  ];

  // Handle bulk status update
  const handleBulkStatusUpdate = () => {
    if (bulkStatus === 'All' || selectedRows.size === 0) return;
    onBulkStatusUpdate(Array.from(selectedRows), bulkStatus);
  };

  // Handle bulk date update
  const handleBulkDateUpdate = () => {
    if (bulkDateField === 'All' || !bulkDate || selectedRows.size === 0) return;
    const dateStr = bulkDate.toISOString().split('T')[0];
    onBulkDateUpdate(Array.from(selectedRows), bulkDateField, dateStr);
  };

  // Handle column visibility toggle
  const handleColumnToggle = (columnKey, visible) => {
    onColumnVisibilityChange(columnKey, visible);
  };

  // Get toggleable columns (exclude checkbox and S.No)
  const toggleableColumns = columns.filter(
    (col) => col.key !== 'checkbox' && col.key !== 'sno'
  );

  if (!reportConfig.supportsBulkStatus && !reportConfig.supportsBulkDate) {
    // Only show export and column visibility if no bulk actions
    return (
      <div className="bg-white p-3 rounded shadow-sm mb-3">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {/* Export Buttons */}
          {showExport && (
            <>
              <button
                className="btn btn-sm"
                style={{ backgroundColor: '#17a2b8', color: 'white' }}
                onClick={onExportPdf}
                disabled={loading}
              >
                View PDF
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={onExportCsv}
                disabled={loading}
              >
                Download Csv File
              </button>
            </>
          )}

          {/* Column Visibility */}
          {toggleableColumns.length > 0 && (
            <div className="d-flex gap-3 align-items-center ms-auto">
              <span className="small fw-semibold">Show Columns:</span>
              {toggleableColumns.map((column) => (
                <div key={column.key} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={column.visible !== false}
                    onChange={(e) => handleColumnToggle(column.key, e.target.checked)}
                    id={`col-${column.key}`}
                  />
                  <label className="form-check-label small" htmlFor={`col-${column.key}`}>
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded shadow-sm mb-3">
      {/* Bulk Actions Row */}
      <div className="d-flex flex-wrap gap-3 align-items-end mb-3">
        {/* Bulk Status Update */}
        {reportConfig.supportsBulkStatus && (
          <>
            <div>
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{ width: '150px' }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleBulkStatusUpdate}
              disabled={bulkStatus === 'All' || selectedRows.size === 0 || loading}
            >
              Bulk Update
            </button>
          </>
        )}

        {/* Bulk Date Update */}
        {reportConfig.supportsBulkDate && (
          <>
            <div>
              <label className="form-label small fw-semibold mb-1">Dates</label>
              <select
                className="form-select form-select-sm"
                value={bulkDateField}
                onChange={(e) => setBulkDateField(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="All">All</option>
                {reportConfig.bulkDateFields?.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label small fw-semibold mb-1">Date</label>
              <DatePicker
                selected={bulkDate}
                onChange={(date) => setBulkDate(date)}
                dateFormat="dd-MM-yyyy"
                placeholderText="dd-mm-yyyy"
                className="form-control form-control-sm"
                disabled={bulkDateField === 'All'}
                showYearDropdown
                dropdownMode="select"
                style={{ width: '150px' }}
              />
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleBulkDateUpdate}
              disabled={bulkDateField === 'All' || !bulkDate || selectedRows.size === 0 || loading}
            >
              Bulk Update
            </button>
          </>
        )}

        {/* Export Buttons */}
        {showExport && (
          <>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: '#17a2b8', color: 'white' }}
              onClick={onExportPdf}
              disabled={loading}
            >
              View PDF
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onExportCsv}
              disabled={loading}
            >
              Download Csv File
            </button>
          </>
        )}
      </div>

      {/* Column Visibility Row */}
      {toggleableColumns.length > 0 && (
        <div className="d-flex flex-wrap gap-3 align-items-center border-top pt-3">
          <span className="small fw-semibold">Show Columns:</span>
          {toggleableColumns.map((column) => (
            <div key={column.key} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                checked={column.visible !== false}
                onChange={(e) => handleColumnToggle(column.key, e.target.checked)}
                id={`col-${column.key}`}
              />
              <label className="form-check-label small" htmlFor={`col-${column.key}`}>
                {column.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkActionsBar;

