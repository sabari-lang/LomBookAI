import React, { useState, useMemo } from 'react';

/**
 * Generic Report Table Component
 * Displays report data with sorting, pagination, and row selection
 */
const ReportTable = ({
  columns = [],
  rows = [],
  loading = false,
  pagination = { page: 1, pageSize: 50, total: 0 },
  onPageChange = () => {},
  onSort = () => {},
  onRowSelect = () => {},
  onRowSelectAll = () => {},
  selectedRows = new Set(),
  onCellClick = null,
  error = null,
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => col.visible !== false);
  }, [columns]);

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (!column.sortable) return;

    const newDirection =
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column.key);
    setSortDirection(newDirection);
    onSort(column.key, newDirection);
  };

  // Handle row checkbox change
  const handleRowSelect = (rowId, checked) => {
    onRowSelect(rowId, checked);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    onRowSelectAll(checked);
  };

  // Check if all rows are selected
  const allSelected = rows.length > 0 && rows.every((row) => selectedRows.has(row.id || row.jobno || row.houseNo));

  // Calculate pagination info
  const startIndex = (pagination.page - 1) * pagination.pageSize + 1;
  const endIndex = Math.min(startIndex + rows.length - 1, pagination.total);
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  // Format cell value
  const formatCellValue = (column, row) => {
    const value = row[column.key];
    if (column.format && typeof column.format === 'function') {
      return column.format(value, row);
    }
    return value || '-';
  };

  // Calculate column count for empty state row
  const columnCount = visibleColumns.length;

  return (
    <div className="bg-white rounded shadow-sm">
      {/* Loading Overlay */}
      {loading && (
        <div className="position-relative" style={{ minHeight: '200px' }}>
          <div className="position-absolute top-50 start-50 translate-middle text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading data...</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="table table-bordered table-hover table-sm mb-0">
            <thead className="table-light sticky-top">
              <tr>
                {/* Select All Checkbox */}
                {visibleColumns.some((col) => col.key === 'checkbox') && (
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="form-check-input"
                      disabled={rows.length === 0}
                    />
                  </th>
                )}

                {/* Column Headers */}
                {visibleColumns
                  .filter((col) => col.key !== 'checkbox')
                  .map((column) => (
                    <th
                      key={column.key}
                      style={{
                        width: column.width || 'auto',
                        cursor: column.sortable && rows.length > 0 ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => rows.length > 0 && handleSort(column)}
                      className={column.sortable && rows.length > 0 ? 'user-select-none' : ''}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span>{column.label}</span>
                        {column.sortable && sortColumn === column.key && rows.length > 0 && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {/* Error State */}
              {error && (
                <tr>
                  <td colSpan={columnCount} className="text-center py-5">
                    <div className="text-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Network Error</strong>
                    </div>
                    <div className="text-muted small mt-2">{error}</div>
                  </td>
                </tr>
              )}

              {/* No Data State */}
              {!error && rows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-inbox me-2" style={{ fontSize: '1.5rem' }}></i>
                      <div className="mt-2">
                        <strong>No data found</strong>
                      </div>
                      <div className="small mt-1">Try adjusting your filters and search again</div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!error && rows.length > 0 && rows.map((row, index) => {
                const rowId = row.id || row.jobno || row.houseNo || index;
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr key={rowId} className={isSelected ? 'table-active' : ''}>
                    {/* Row Checkbox */}
                    {visibleColumns.some((col) => col.key === 'checkbox') && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelect(rowId, e.target.checked)}
                          className="form-check-input"
                        />
                      </td>
                    )}

                    {/* Row Data */}
                    {visibleColumns
                      .filter((col) => col.key !== 'checkbox')
                      .map((column) => {
                        const cellValue = formatCellValue(column, row);
                        const isLink = column.isLink && column.onClickLink;

                        return (
                          <td
                            key={column.key}
                            onClick={() => {
                              if (isLink && column.onClickLink) {
                                column.onClickLink(row);
                              } else if (onCellClick) {
                                onCellClick(column.key, row);
                              }
                            }}
                            className={isLink ? 'text-primary' : ''}
                            style={{
                              whiteSpace: 'nowrap',
                              cursor: isLink ? 'pointer' : 'default',
                              textDecoration: isLink ? 'underline' : 'none',
                            }}
                          >
                            {cellValue}
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Info and Controls - Only show if not loading and has data or error */}
      {!loading && (
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <div className="text-muted small">
            {rows.length > 0 ? (
              <>Showing {startIndex} to {endIndex} of {pagination.total} entries</>
            ) : (
              <>No entries to display</>
            )}
          </div>
          {rows.length > 0 && (
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small me-2">Page {pagination.page} of {totalPages}</span>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportTable;

