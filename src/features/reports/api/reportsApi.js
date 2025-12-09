import { api } from '../../../lib/httpClient';

/**
 * API client for Logistics Reports
 * Simple functions that return promises - used with useQuery/useMutation
 */

/**
 * Fetch report data
 * @param {Object} params - Report request parameters
 * @param {string} params.apiEndpoint - Backend endpoint path (e.g., '/clearance-pending')
 * @param {Object} params.filters - Filter values object
 * @param {number} params.page - Current page number (1-based)
 * @param {number} params.pageSize - Number of records per page
 * @param {string} [params.sortBy] - Column key to sort by
 * @param {string} [params.sortDir] - Sort direction ('asc' | 'desc')
 * @returns {Promise<Object>} Raw API response
 */
export const fetchReport = (params) => {
  if (!params || !params.apiEndpoint) {
    console.error('fetchReport: Missing apiEndpoint in params', params);
    return Promise.reject(new Error('Missing apiEndpoint'));
  }

  const { apiEndpoint, filters, page = 1, pageSize = 50, sortBy, sortDir } = params;

  // Build query parameters matching backend DTO expectations
  // Backend uses Page and Limit (not PageSize)
  const queryParams = {
    Page: page,
    Limit: pageSize,
  };

  // Add filter values (excluding empty strings and 'All' values)
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      // Skip empty strings and 'All' values
      if (value !== '' && value !== null && value !== undefined && value !== 'All') {
        queryParams[key] = value;
      }
    });
  }

  // Add sorting if provided
  if (sortBy) {
    queryParams.sortBy = sortBy;
    queryParams.sortDir = sortDir || 'asc';
  }

  // Log for debugging (can be removed later)
  console.log('[fetchReport]', {
    apiEndpoint,
    Page: queryParams.Page,
    Limit: queryParams.Limit,
    filterKeys: Object.keys(filters || {}),
    sortBy: queryParams.sortBy,
    sortDir: queryParams.sortDir,
  });

  // Build full URL: /logistics-reports${apiEndpoint}
  // apiEndpoint is just the segment (e.g., '/clearance-pending')
  // api client has base /api, so final URL becomes /api/logistics-reports/clearance-pending
  const fullEndpoint = `/logistics-reports${apiEndpoint}`;
  
  return api.get(fullEndpoint, {
    params: queryParams,
  }).then((response) => {
    console.log('[fetchReport] Response received for', fullEndpoint, 'Total items:', response.data?.data?.length || response.data?.items?.length || 'unknown');
    return response.data;
  }).catch((error) => {
    console.error('[fetchReport] Error for', fullEndpoint, error);
    throw error;
  });
};

/**
 * Bulk update status for selected records
 * @param {Object} params
 * @param {string} params.apiEndpoint - Backend endpoint path (e.g., '/clearance-pending')
 * @param {Array<string>} params.recordIds - Array of record IDs (job/house IDs)
 * @param {string} params.status - New status value
 * @returns {Promise<Object>} Raw API response
 */
export const bulkUpdateStatus = (params) => {
  const { apiEndpoint, recordIds, status } = params;
  // Build full URL: /logistics-reports${apiEndpoint}/bulk-status
  const fullEndpoint = `/logistics-reports${apiEndpoint}/bulk-status`;
  return api.post(fullEndpoint, {
    recordIds,
    status,
  }).then((response) => response.data);
};

/**
 * Bulk update date for selected records
 * @param {Object} params
 * @param {string} params.apiEndpoint - Backend endpoint path (e.g., '/clearance-pending')
 * @param {Array<string>} params.recordIds - Array of record IDs
 * @param {string} params.dateField - Date field to update (e.g., 'eta_date', 'clearance_date')
 * @param {string} params.date - New date value (ISO format or dd-MM-yyyy)
 * @returns {Promise<Object>} Raw API response
 */
export const bulkUpdateDate = (params) => {
  const { apiEndpoint, recordIds, dateField, date } = params;
  // Build full URL: /logistics-reports${apiEndpoint}/bulk-date
  const fullEndpoint = `/logistics-reports${apiEndpoint}/bulk-date`;
  return api.post(fullEndpoint, {
    recordIds,
    dateField,
    date,
  }).then((response) => response.data);
};

/**
 * Export report as PDF
 * @param {Object} params
 * @param {string} params.apiEndpoint - Backend endpoint path (e.g., '/clearance-pending')
 * @param {Object} params.filters - Current filter values
 * @param {Array<string>} [params.selectedIds] - Optional: specific record IDs to export
 * @returns {Promise<void>} Downloads PDF file
 */
export const exportPdf = (params) => {
  const { apiEndpoint, filters, selectedIds } = params;
  // Build full URL: /logistics-reports${apiEndpoint}/export/pdf
  const fullEndpoint = `/logistics-reports${apiEndpoint}/export/pdf`;
  
  return api.post(
    fullEndpoint,
    { filters, selectedIds },
    { responseType: 'blob' }
  ).then((response) => {
    // Create blob URL for download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${apiEndpoint.replace('/', '_')}_report_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

/**
 * Export report as CSV
 * @param {Object} params
 * @param {string} params.apiEndpoint - Backend endpoint path (e.g., '/clearance-pending')
 * @param {Object} params.filters - Current filter values
 * @param {Array<string>} [params.selectedIds] - Optional: specific record IDs to export
 * @returns {Promise<void>} Downloads CSV file
 */
export const exportCsv = (params) => {
  const { apiEndpoint, filters, selectedIds } = params;
  // Build full URL: /logistics-reports${apiEndpoint}/export/csv
  const fullEndpoint = `/logistics-reports${apiEndpoint}/export/csv`;
  
  return api.post(
    fullEndpoint,
    { filters, selectedIds },
    { responseType: 'blob' }
  ).then((response) => {
    // Create blob URL for download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${apiEndpoint.replace('/', '_')}_report_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

/**
 * Fetch dynamic options for a filter field
 * @param {string} endpoint - Full API endpoint (e.g., '/logistics-reports/filters/customer-care')
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export const fetchFilterOptions = (endpoint) => {
  // endpoint should already include /logistics-reports/filters/... from reportDefinitions
  return api.get(endpoint)
    .then((response) => {
      const data = response.data?.data || response.data || [];
      
      // Normalize to {value, label} format
      // Add 'All' option at the beginning
      const normalizedOptions = [];
      
      if (Array.isArray(data)) {
        const mapped = data.map((item) => {
          if (typeof item === 'string') {
            return { value: item, label: item };
          }
          return {
            value: item.id || item.value || item.name || item,
            label: item.label || item.name || item.id || item,
          };
        });
        
        // Add 'All' option at the beginning
        normalizedOptions.push({ value: 'All', label: 'All' });
        normalizedOptions.push(...mapped);
      }
      
      return normalizedOptions;
    })
    .catch((error) => {
      console.error(`Error fetching filter options from ${endpoint}:`, error);
      // Return at least 'All' option on error
      return [{ value: 'All', label: 'All' }];
    });
};

