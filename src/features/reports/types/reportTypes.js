/**
 * Type definitions for the Logistics Reports module
 */

// Filter field types
export const FilterFieldType = {
  SELECT: 'select',
  DATERANGE: 'dateRange',
  TEXT: 'text',
  AUTOCOMPLETE: 'autocomplete',
};

// Column configuration
export const createColumnConfig = (key, label, options = {}) => ({
  key,
  label,
  width: options.width,
  sortable: options.sortable !== false,
  isLink: options.isLink || false,
  onClickLink: options.onClickLink || null,
  visibleByDefault: options.visibleByDefault !== false,
  format: options.format || null, // function to format cell value
});

// Filter field configuration
export const createFilterField = (key, label, type, options = {}) => ({
  key,
  label,
  type,
  required: options.required || false,
  optionsEndpoint: options.optionsEndpoint || null,
  staticOptions: options.staticOptions || [],
  dependsOn: options.dependsOn || null,
  visibleWhen: options.visibleWhen || null,
  enabledWhen: options.enabledWhen || null,
  placeholder: options.placeholder || '',
  defaultValue: options.defaultValue || (type === FilterFieldType.SELECT ? 'All' : ''),
});

// Report definition structure
export const createReportDefinition = (id, title, path, options = {}) => ({
  id,
  title,
  path,
  headerColor: options.headerColor || '#28a745', // default green
  filterConfig: options.filterConfig || [],
  columnConfig: options.columnConfig || [],
  apiEndpoint: options.apiEndpoint || `/reports/${id}`,
  pageSize: options.pageSize || 50,
  supportsBulkStatus: options.supportsBulkStatus || false,
  supportsBulkDate: options.supportsBulkDate || false,
  bulkDateFields: options.bulkDateFields || [],
});

