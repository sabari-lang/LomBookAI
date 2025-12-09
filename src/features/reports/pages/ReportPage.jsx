import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import BulkActionsBar from '../components/BulkActionsBar';
import { getReportById, getReportByPath } from '../config/reportDefinitions';
import {
  fetchReport,
  bulkUpdateStatus,
  bulkUpdateDate,
  exportPdf,
  exportCsv,
} from '../api/reportsApi';
import { extractItems } from '../../../utils/extractItems';
import { extractPagination } from '../../../utils/extractPagination';
import { handleProvisionalError } from '../../../utils/handleProvisionalError';

/**
 * Generic Report Page Component
 * Handles all report logic and state management
 */
const ReportPage = () => {
  const location = useLocation();
  // Try to get reportId from params, or derive from path
  const reportConfig = getReportByPath(location.pathname) || getReportById(useParams().reportId);

  const queryClient = useQueryClient();

  // State
  const [filterValues, setFilterValues] = useState({});
  const [columns, setColumns] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [errors, setErrors] = useState({});
  const [hasResults, setHasResults] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null); // Track when filters are applied
  const [hasSearched, setHasSearched] = useState(false); // Track if user has clicked Result

  // Initialize filter values and columns from config
  useEffect(() => {
    if (!reportConfig) return;

    // Initialize filter values with defaults
    const initialFilters = {};
    reportConfig.filterConfig.forEach((field) => {
      initialFilters[field.key] = field.defaultValue || '';
    });
    setFilterValues(initialFilters);

    // Initialize columns with visibility
    const initialColumns = reportConfig.columnConfig.map((col) => ({
      ...col,
      visible: col.visibleByDefault !== false,
    }));
    setColumns(initialColumns);
  }, [reportConfig]);

  // Build query params from filters - only when user has searched
  const queryParams = useMemo(() => {
    if (!hasSearched || !appliedFilters || !reportConfig || !reportConfig.apiEndpoint) {
      return null;
    }
    
    return {
      apiEndpoint: reportConfig.apiEndpoint, // Use backend endpoint from config
      filters: appliedFilters,
      page,
      pageSize: reportConfig.pageSize,
      sortBy,
      sortDir,
    };
  }, [hasSearched, reportConfig, appliedFilters, page, sortBy, sortDir]);

  // Determine if query should be enabled
  const isQueryEnabled = Boolean(reportConfig && reportConfig.apiEndpoint && hasSearched && queryParams);

  // Fetch report data using useQuery
  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: ['logisticsReport', reportConfig?.id, appliedFilters, page, sortBy, sortDir],
    queryFn: () => {
      if (!queryParams) {
        throw new Error('Query params not ready');
      }
      return fetchReport(queryParams);
    },
    enabled: isQueryEnabled, // Only fetch when user has clicked Result and all params are ready
    keepPreviousData: true,
    retry: 1,
    onError: (err) => {
      // Error is handled in the table component, but we can log it here
      console.error('Report fetch error:', err);
    },
  });

  // Only show loading when query is actually enabled and running
  const isActuallyLoading = isQueryEnabled && isLoading;

  // Extract rows and pagination from API response
  const rows = useMemo(() => {
    if (!reportData) return [];
    const items = extractItems(reportData) ?? [];
    return items.map((row, index) => ({
      ...row,
      id: row.id || row.jobno || row.houseNo || index + 1,
    }));
  }, [reportData]);

  const paginationData = extractPagination(reportData);
  const totalRows = Number.isFinite(paginationData.totalCount) 
    ? paginationData.totalCount 
    : rows.length;

  const pagination = {
    page,
    pageSize: reportConfig?.pageSize || 50,
    total: totalRows,
  };

  // Set hasResults when query completes (success or error)
  useEffect(() => {
    if (hasSearched && (reportData !== undefined || isError)) {
      setHasResults(true);
    }
  }, [hasSearched, reportData, isError]);

  // Handle Result button click
  const handleResult = (filters) => {
    // Validate filters
    const validationErrors = {};
    reportConfig.filterConfig.forEach((field) => {
      if (field.required) {
        const enabled = field.enabledWhen ? field.enabledWhen(filters) : true;
        if (enabled && !filters[field.key]) {
          validationErrors[field.key] = `${field.label} is required`;
        }
      }

      // Date range validation
      if (field.type === 'dateRange' && field.key === 'fromDate') {
        if (filters.fromDate && filters.toDate) {
          if (new Date(filters.fromDate) > new Date(filters.toDate)) {
            validationErrors.fromDate = 'From date must be less than or equal to To date';
          }
        }
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setAppliedFilters(filters); // Set filters to apply
    setPage(1); // Reset to first page
    setSelectedRows(new Set()); // Clear selections
    setHasSearched(true); // Mark that user has clicked Result - this enables the query
    // Don't set hasResults here - wait for query to complete
  };

  // Handle Reset button click
  const handleReset = () => {
    const resetFilters = {};
    reportConfig.filterConfig.forEach((field) => {
      resetFilters[field.key] = field.defaultValue || '';
    });
    setFilterValues(resetFilters);
    setErrors({});
    setHasResults(false);
    setAppliedFilters(null); // Clear applied filters
    setHasSearched(false); // Reset search flag - this disables the query
    setPage(1);
    setSelectedRows(new Set());
  };

  // Handle Refresh button click
  const handleRefresh = () => {
    if (hasSearched && appliedFilters) {
      // Invalidate query to refetch with current filters
      queryClient.invalidateQueries(['logisticsReport', reportConfig.id, appliedFilters, page, sortBy, sortDir]);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSelectedRows(new Set()); // Clear selections on page change
  };

  // Handle sort
  const handleSort = (columnKey, direction) => {
    setSortBy(columnKey);
    setSortDir(direction);
  };

  // Handle row selection
  const handleRowSelect = (rowId, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = rows.map((row) => row.id || row.jobno || row.houseNo);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Bulk Status Update Mutation
  const bulkStatusMutation = useMutation({
    mutationFn: ({ recordIds, status }) =>
      bulkUpdateStatus({
        apiEndpoint: reportConfig.apiEndpoint,
        recordIds,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['logisticsReport', reportConfig.id]);
      setSelectedRows(new Set());
    },
    onError: (error) => handleProvisionalError(error, 'Bulk Update Status'),
  });

  // Bulk Date Update Mutation
  const bulkDateMutation = useMutation({
    mutationFn: ({ recordIds, dateField, date }) =>
      bulkUpdateDate({
        apiEndpoint: reportConfig.apiEndpoint,
        recordIds,
        dateField,
        date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['logisticsReport', reportConfig.id]);
      setSelectedRows(new Set());
    },
    onError: (error) => handleProvisionalError(error, 'Bulk Update Date'),
  });

  // Export PDF Mutation
  const exportPdfMutation = useMutation({
    mutationFn: () =>
      exportPdf({
        apiEndpoint: reportConfig.apiEndpoint,
        filters: appliedFilters || filterValues,
        selectedIds: selectedRows.size > 0 ? Array.from(selectedRows) : null,
      }),
    onError: (error) => handleProvisionalError(error, 'Export PDF'),
  });

  // Export CSV Mutation
  const exportCsvMutation = useMutation({
    mutationFn: () =>
      exportCsv({
        apiEndpoint: reportConfig.apiEndpoint,
        filters: appliedFilters || filterValues,
        selectedIds: selectedRows.size > 0 ? Array.from(selectedRows) : null,
      }),
    onError: (error) => handleProvisionalError(error, 'Export CSV'),
  });

  // Handle bulk status update
  const handleBulkStatusUpdate = (recordIds, status) => {
    if (!reportConfig || !reportConfig.supportsBulkStatus) return;
    bulkStatusMutation.mutate({ recordIds, status });
  };

  // Handle bulk date update
  const handleBulkDateUpdate = (recordIds, dateField, date) => {
    if (!reportConfig || !reportConfig.supportsBulkDate) return;
    bulkDateMutation.mutate({ recordIds, dateField, date });
  };

  // Handle export PDF
  const handleExportPdf = () => {
    if (!reportConfig) return;
    exportPdfMutation.mutate();
  };

  // Handle export CSV
  const handleExportCsv = () => {
    if (!reportConfig) return;
    exportCsvMutation.mutate();
  };

  // Handle column visibility change
  const handleColumnVisibilityChange = (columnKey, visible) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === columnKey ? { ...col, visible } : col))
    );
  };

  // Handle House No link click (navigate to house report)
  const handleHouseNoClick = (row) => {
    // TODO: Navigate to house report page
    console.log('Navigate to house report for:', row.houseNo);
    // Example: navigate(`/house-report/${row.houseNo}`);
  };

  if (!reportConfig) {
    return (
      <div className="p-4">
        <div className="alert alert-danger">Report not found</div>
      </div>
    );
  }

  // Update columns with onClickLink for House No
  const columnsWithLinks = columns.map((col) => {
    if (col.key === 'houseNo' && col.isLink) {
      return { ...col, onClickLink: handleHouseNoClick };
    }
    return col;
  });

  return (
    <div className="p-3">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {reportConfig.title}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div
        className="p-2 mb-3 rounded text-white"
        style={{ backgroundColor: reportConfig.headerColor }}
      >
        <h6 className="mb-0">{reportConfig.title}</h6>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="alert alert-danger mb-3">{errors.general}</div>
      )}

      {/* Filter Panel */}
          <ReportFilters
            filterConfig={reportConfig.filterConfig}
            values={filterValues}
            onChange={setFilterValues}
            onResult={handleResult}
            onReset={handleReset}
            onRefresh={handleRefresh}
            loading={isActuallyLoading}
            hasSearched={hasSearched}
            errors={errors}
          />

      {/* Bulk Actions & Results (only show when user clicked Result and query has completed) */}
      {hasResults && appliedFilters && (
        <>
          <BulkActionsBar
            reportConfig={reportConfig}
            selectedRows={selectedRows}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkDateUpdate={handleBulkDateUpdate}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            columns={columnsWithLinks}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            loading={isActuallyLoading || bulkStatusMutation.isLoading || bulkDateMutation.isLoading || exportPdfMutation.isLoading || exportCsvMutation.isLoading}
          />

          <ReportTable
            columns={columnsWithLinks}
            rows={rows}
            loading={isActuallyLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onRowSelectAll={handleSelectAll}
            selectedRows={selectedRows}
            error={isError ? (error?.response?.data?.message || error?.message || 'Failed to load report data') : null}
          />
        </>
      )}
    </div>
  );
};

export default ReportPage;

