import {
  FilterFieldType,
  createFilterField,
  createColumnConfig,
  createReportDefinition,
} from '../types/reportTypes';

/**
 * Report Definitions
 * Each report is configured here with its filters, columns, and settings
 */

// ============================================
// REPORT 1: CLEARANCE PENDING REPORT
// ============================================
export const clearancePendingReport = createReportDefinition(
  'clearancePending',
  'Clearance Pending Report',
  '/reports/clearance-pending',
  {
    headerColor: '#28a745', // Green
    pageSize: 50,
    apiEndpoint: '/clearance-pending', // Backend endpoint
    supportsBulkStatus: true,
    supportsBulkDate: true,
    bulkDateFields: [
      { key: 'eta_date', label: 'ETA Date' },
      { key: 'etd_date', label: 'ETD Date' },
      { key: 'clearance_date', label: 'Clearance Date' },
    ],
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'ETA', label: 'ETA' },
          { value: 'ETD', label: 'ETD' },
          { value: 'Clearance Date', label: 'Clearance Date' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Temporary static list; backend endpoint can replace this once ready
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'CHENNAI', label: 'CHENNAI' },
          { value: 'HYDERABAD', label: 'HYDERABAD' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'COCHIN', label: 'COCHIN' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches', // final backend source
        defaultValue: 'All',
      }),
      createFilterField('customerCareName', 'Customer Care Name', FilterFieldType.SELECT, {
        optionsEndpoint: '/logistics-reports/filters/customer-care', // Full backend filter endpoint
        defaultValue: 'All',
      }),
      createFilterField('basedOn', 'Based on', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Exclusive', label: 'Exclusive' },
          { value: 'Included Job', label: 'Included Job' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('status', 'Status', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Open', label: 'Open' },
          { value: 'Not Arrived', label: 'Not Arrived' },
          { value: 'Today Planning', label: 'Today Planning' },
          { value: 'Awaiting for Duty', label: 'Awaiting for Duty' },
          { value: 'Queries from Customs', label: 'Queries from Customs' },
          { value: 'Awaiting CEPA', label: 'Awaiting CEPA' },
          { value: 'OOC Completed', label: 'OOC Completed' },
          { value: 'Delivered', label: 'Delivered' },
          { value: 'Others', label: 'Others' },
          { value: 'Clearance Completed', label: 'Clearance Completed' },
          { value: 'Pending for Query', label: 'Pending for Query' },
        ],
        optionsEndpoint: '/logistics-reports/filters/statuses', // final backend source
        defaultValue: 'All',
      }),
      createFilterField('incoterms', 'Incoterms', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'CIF', label: 'CIF' },
          { value: 'C & F', label: 'C & F' },
          { value: 'CAF', label: 'CAF' },
          { value: 'CFR', label: 'CFR' },
          { value: 'CPT', label: 'CPT' },
          { value: 'DAP', label: 'DAP' },
          { value: 'DDP', label: 'DDP' },
          { value: 'DDU', label: 'DDU' },
          { value: 'EXW', label: 'EXW' },
          { value: 'FAS', label: 'FAS' },
          { value: 'FCA', label: 'FCA' },
          { value: 'FOB', label: 'FOB' },
        ],
        optionsEndpoint: '/logistics-reports/filters/incoterms', // final backend source
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No (starts with)',
      }),
      createFilterField('masterNo', 'Master No', FilterFieldType.TEXT, {
        placeholder: 'Enter Master No',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('SearchBy', 'Search By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Shipper Invoice No', label: 'Shipper Invoice No' },
          { value: 'Vessel Name', label: 'Vessel Name' },
          { value: 'Flight No', label: 'Flight No' },
          { value: 'Remarks', label: 'Remarks' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('SearchValue', 'Search Value', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
        required: true,
        enabledWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
        visibleWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
      }),
      createFilterField('OrderBy', 'Order By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Consignee Name', label: 'Consignee Name' },
          { value: 'Shipper Name', label: 'Shipper Name' },
          { value: 'Job No', label: 'Job No' },
          { value: 'ETA Date', label: 'ETA Date' },
          { value: 'ETD Date', label: 'ETD Date' },
        ],
        defaultValue: 'Consignee Name',
      }),
      createFilterField('sortBy', 'Sort By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Ascending', label: 'Ascending' },
          { value: 'Descending', label: 'Descending' },
        ],
        defaultValue: 'Ascending',
      }),
    ],
    columnConfig: [
      createColumnConfig('checkbox', 'C', { sortable: false, visibleByDefault: true }),
      createColumnConfig('sno', 'S.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('consigneeName', 'Consignee Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('shipperName', 'Shipper Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('masterNo', 'Master No', { sortable: true, visibleByDefault: true }),
      createColumnConfig('houseNo', 'House No', {
        sortable: true,
        visibleByDefault: true,
        isLink: true,
      }),
      createColumnConfig('remarks', 'Remarks', { sortable: false, visibleByDefault: true }),
      createColumnConfig('shipperInvoiceNo', 'Shipper Invoice No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('status', 'Status', { sortable: true, visibleByDefault: true }),
      createColumnConfig('typeOfShipment', 'Type of Shipment', { sortable: false, visibleByDefault: true }),
      createColumnConfig('pkgGwt', 'PKG / GWT', { sortable: false, visibleByDefault: true }),
      createColumnConfig('etaDate', 'ETA_Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('etdDate', 'ETD_Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('flightNoVessel', 'Flight No / Vessel N', { sortable: false, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 2: INVOICE PENDING REPORT
// ============================================
export const invoicePendingReport = createReportDefinition(
  'invoicePending',
  'Invoice Pending Report',
  '/reports/invoice-pending',
  {
    headerColor: '#ffc107', // Yellow
    pageSize: 50,
    apiEndpoint: '/invoice-pending', // Backend endpoint
    supportsBulkStatus: true,
    supportsBulkDate: true,
    bulkDateFields: [{ key: 'clearance_date', label: 'Clearance Date' }],
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
      staticOptions: [
        { value: 'All', label: 'All' },
        { value: 'Clearance Date', label: 'Clearance Date' },
        { value: 'Invoice Date', label: 'Invoice Date' },
      ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
      // Static fallback (legacy PHP list); backend endpoint may supply live data
      staticOptions: [
        { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
        { value: 'ANATHAPUR', label: 'ANATHAPUR' },
        { value: 'BANGALORE', label: 'BANGALORE' },
        { value: 'MUMBAI', label: 'MUMBAI' },
        { value: 'NEW DELHI', label: 'NEW DELHI' },
        { value: 'BLR SALES', label: 'BLR SALES' },
        { value: 'All', label: 'All' },
      ],
      optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('status', 'Status', FilterFieldType.SELECT, {
      staticOptions: [
        { value: 'All', label: 'All' },
        { value: 'Open', label: 'Open' },
        { value: 'Not Arrived', label: 'Not Arrived' },
        { value: 'Today Planning', label: 'Today Planning' },
        { value: 'Awaiting for Duty', label: 'Awaiting for Duty' },
        { value: 'Queries from Customs', label: 'Queries from Customs' },
        { value: 'Awaiting CEPA', label: 'Awaiting CEPA' },
        { value: 'OOC Completed', label: 'OOC Completed' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Others', label: 'Others' },
        { value: 'Clearance Completed', label: 'Clearance Completed' },
        { value: 'Pending for Query', label: 'Pending for Query' },
      ],
      optionsEndpoint: '/logistics-reports/filters/statuses',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),
      createFilterField('SearchBy', 'Search By', FilterFieldType.SELECT, {
      staticOptions: [
        { value: 'All', label: 'All' },
        { value: 'Shipper Invoice No', label: 'Shipper Invoice No' },
      ],
      defaultValue: 'All',
      }),
      createFilterField('SearchValue', 'Search Value', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
        required: true,
        enabledWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
        visibleWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('OrderBy', 'Order By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Consignee Name', label: 'Consignee Name' },
          { value: 'Shipper Name', label: 'Shipper Name' },
          { value: 'Job No', label: 'Job No' },
          { value: 'ETA Date', label: 'ETA Date' },
          { value: 'ETD Date', label: 'ETD Date' },
        ],
      defaultValue: 'Consignee Name',
      }),
      createFilterField('sortBy', 'Sort By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Ascending', label: 'Ascending' },
          { value: 'Descending', label: 'Descending' },
        ],
        defaultValue: 'Ascending',
      }),
      createFilterField('customerCareName', 'Customer Care Name', FilterFieldType.SELECT, {
        optionsEndpoint: '/logistics-reports/filters/customer-care',
        defaultValue: 'All',
      }),
    ],
    columnConfig: [
      createColumnConfig('checkbox', 'C', { sortable: false, visibleByDefault: true }),
      createColumnConfig('sno', 'S.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('consigneeName', 'Consignee Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('shipperName', 'Shipper Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('houseNo', 'House No', { sortable: true, visibleByDefault: true, isLink: true }),
      createColumnConfig('shipperInvoiceNo', 'Shipper Invoice No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('status', 'Status', { sortable: true, visibleByDefault: true }),
      createColumnConfig('clearanceDate', 'Clearance Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('branch', 'Branch', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 3: DESPATCH PENDING REPORT
// ============================================
export const despatchPendingReport = createReportDefinition(
  'despatchPending',
  'Despatch Pending Report',
  '/reports/despatch-pending',
  {
    headerColor: '#17a2b8', // Teal
    pageSize: 50,
    apiEndpoint: '/despatch-pending', // Backend endpoint
    supportsBulkStatus: true,
    supportsBulkDate: true,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Clearance Date', label: 'Clearance Date' },
          { value: 'Invoice Date', label: 'Invoice Date' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('SearchBy', 'Search By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Shipper Invoice No', label: 'Shipper Invoice No' },
          { value: 'Vessel Name', label: 'Vessel Name' },
          { value: 'Flight No', label: 'Flight No' },
          { value: 'Remarks', label: 'Remarks' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('SearchValue', 'Search Value', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
        required: true,
        enabledWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
        visibleWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
      }),
      createFilterField('status', 'Status', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Open', label: 'Open' },
          { value: 'Not Arrived', label: 'Not Arrived' },
          { value: 'Today Planning', label: 'Today Planning' },
          { value: 'Awaiting for Duty', label: 'Awaiting for Duty' },
          { value: 'Queries from Customs', label: 'Queries from Customs' },
          { value: 'Awaiting CEPA', label: 'Awaiting CEPA' },
          { value: 'OOC Completed', label: 'OOC Completed' },
          { value: 'Delivered', label: 'Delivered' },
          { value: 'Others', label: 'Others' },
          { value: 'Clearance Completed', label: 'Clearance Completed' },
          { value: 'Pending for Query', label: 'Pending for Query' },
        ],
        optionsEndpoint: '/logistics-reports/filters/statuses',
        defaultValue: 'All',
      }),
      createFilterField('customerCareName', 'Customer Care Name', FilterFieldType.SELECT, {
        optionsEndpoint: '/logistics-reports/filters/customer-care',
        defaultValue: 'All',
      }),
    ],
    columnConfig: [
      createColumnConfig('checkbox', 'C', { sortable: false, visibleByDefault: true }),
      createColumnConfig('sno', 'S.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('lomInvoice', 'LOM Invoice', { sortable: false, visibleByDefault: true }),
      createColumnConfig('houseNo', 'House No', { sortable: true, visibleByDefault: true, isLink: true }),
      createColumnConfig('shipperInvoiceNo', 'Shipper Invoice No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('clearanceDate', 'Clearance Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('invoiceDate', 'Invoice Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('status', 'Status', { sortable: true, visibleByDefault: true }),
      createColumnConfig('branch', 'Branch', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 4: INVOICE REPORT
// ============================================
export const invoiceReport = createReportDefinition(
  'invoice',
  'Invoice Report',
  '/reports/invoice',
  {
    headerColor: '#007bff', // Blue
    pageSize: 50,
    apiEndpoint: '/invoice-pending', // Backend endpoint (using invoice-pending if /invoice doesn't exist)
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'ALL' },
          { value: 'VOUCHER_DATE', label: 'Voucher Date' },
        ],
        defaultValue: 'ALL',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy PHP list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('searchBy', 'Search By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'All' },
          { value: 'SHIPPER_INVOICE_NO', label: 'Shipper Invoice No' },
          { value: 'LOM_INVOICE_NO', label: 'LOM Invoice No' },
          { value: 'CUSTOMER', label: 'Customer' },
        ],
        defaultValue: 'ALL',
      }),
      createFilterField('values', 'Values', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
      }),
      createFilterField('status', 'Status', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Accounting Entry (Approved)', label: 'Accounting Entry (Approved)' },
          { value: 'Integrated', label: 'Integrated' },
          { value: 'Cancelled', label: 'Cancelled' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('transaction', 'Transaction', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'All' },
          { value: 'CUSTOMER', label: 'Customer' },
          { value: 'VENDOR', label: 'Vendor' },
        ],
        defaultValue: 'ALL',
      }),
      createFilterField('voucherType', 'Voucher Type', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'All' },
          { value: 'SALES', label: 'Sales' },
          { value: 'PURCHASE', label: 'Purchase' },
          { value: 'DEBIT_NOTE', label: 'Debit Note' },
          { value: 'CREDIT_NOTE', label: 'Credit Note' },
          { value: 'JOURNAL', label: 'Journal' },
        ],
        defaultValue: 'ALL',
      }),
    ],
    columnConfig: [
      createColumnConfig('date', 'Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('voucherNo', 'Voucher No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('expVchNo', 'Exp VCH No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('status', 'Status', { sortable: true, visibleByDefault: true }),
      createColumnConfig('voucherType', 'Voucher Type', { sortable: false, visibleByDefault: true }),
      createColumnConfig('partyName', 'Party Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('masterNumber', 'Master Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('houseNumber', 'House Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('otherDates', 'Other Dates', { sortable: false, visibleByDefault: true }),
      createColumnConfig('othersDetails', 'Others Details', { sortable: false, visibleByDefault: true }),
      createColumnConfig('commericalInvoice', 'Commerical Invoice', { sortable: false, visibleByDefault: true }),
      createColumnConfig('currency', 'Currency', { sortable: false, visibleByDefault: true }),
      createColumnConfig('amount', 'Amount', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 5: B/L SEARCH REPORT
// ============================================
export const blSearchReport = createReportDefinition(
  'blSearch',
  'B/L Report',
  '/reports/bl-search',
  {
    headerColor: '#6c757d', // Dark grey
    pageSize: 50,
    apiEndpoint: '/bl-search', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'ETA Date', label: 'ETA Date' },
          { value: 'ETD Date', label: 'ETD Date' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy PHP list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('status', 'Status', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Open', label: 'Open' },
          { value: 'Not Arrived', label: 'Not Arrived' },
          { value: 'Today Planning', label: 'Today Planning' },
          { value: 'Awaiting for Duty', label: 'Awaiting for Duty' },
          { value: 'Queries from Customs', label: 'Queries from Customs' },
          { value: 'Awaiting CEPA', label: 'Awaiting CEPA' },
          { value: 'OOC Completed', label: 'OOC Completed' },
          { value: 'Delivered', label: 'Delivered' },
          { value: 'Others', label: 'Others' },
          { value: 'Clearance Completed', label: 'Clearance Completed' },
          { value: 'Pending for Query', label: 'Pending for Query' },
        ],
        optionsEndpoint: '/logistics-reports/filters/statuses',
        defaultValue: 'All',
      }),
      createFilterField('incoterms', 'Incoterms', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'CIF', label: 'CIF' },
          { value: 'C & F', label: 'C & F' },
          { value: 'CAF', label: 'CAF' },
          { value: 'CFR', label: 'CFR' },
          { value: 'CPT', label: 'CPT' },
          { value: 'DAP', label: 'DAP' },
          { value: 'DDP', label: 'DDP' },
          { value: 'DDU', label: 'DDU' },
          { value: 'EXW', label: 'EXW' },
          { value: 'FAS', label: 'FAS' },
          { value: 'FCA', label: 'FCA' },
          { value: 'FOB', label: 'FOB' },
        ],
        optionsEndpoint: '/logistics-reports/filters/incoterms',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),
      createFilterField('masterNo', 'Master No', FilterFieldType.TEXT, {
        placeholder: 'Enter Master No',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('SearchBy', 'Search By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Shipper Invoice No', label: 'Shipper Invoice No' },
          { value: 'Vessel Name', label: 'Vessel Name' },
          { value: 'Flight No', label: 'Flight No' },
          { value: 'Remarks', label: 'Remarks' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('SearchValue', 'Search Value', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
        required: true,
        enabledWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
        visibleWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
      }),
      createFilterField('OrderBy', 'Order By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Consignee Name', label: 'Consignee Name' },
          { value: 'Shipper Name', label: 'Shipper Name' },
          { value: 'Job No', label: 'Job No' },
          { value: 'ETA Date', label: 'ETA Date' },
          { value: 'ETD Date', label: 'ETD Date' },
        ],
        defaultValue: 'Consignee Name',
      }),
      createFilterField('sortBy', 'Sort By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Ascending', label: 'Ascending' },
          { value: 'Descending', label: 'Descending' },
        ],
        defaultValue: 'Ascending',
      }),
    ],
    columnConfig: [
      createColumnConfig('sno', 'S.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('consigneeName', 'Consignee Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('shipperName', 'Shipper Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('masterNo', 'Master No', { sortable: true, visibleByDefault: true }),
      createColumnConfig('houseNo', 'House No', { sortable: true, visibleByDefault: true, isLink: true }),
      createColumnConfig('remarks', 'Remarks', { sortable: false, visibleByDefault: true }),
      createColumnConfig('shipperInvoiceNo', 'Shipper Invoice No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('status', 'Status', { sortable: true, visibleByDefault: true }),
      createColumnConfig('typeOfShipment', 'Type of Shipment', { sortable: false, visibleByDefault: true }),
      createColumnConfig('pkgGwt', 'PKG / GWT', { sortable: false, visibleByDefault: true }),
      createColumnConfig('etaDate', 'ETA_Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('etdDate', 'ETD_Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('flightNoVessel', 'Flight No / Vessel N', { sortable: false, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 6: DEPOSIT / REFUND REPORT
// ============================================
export const depositRefundReport = createReportDefinition(
  'depositRefund',
  'Deposit / Refund Report',
  '/reports/deposit-refund',
  {
    headerColor: '#ffc107', // Yellow
    pageSize: 50,
    apiEndpoint: '/deposit-refund', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Issue Date', label: 'Issue Date' },
          { value: 'Received Date', label: 'Received Date' },
          { value: 'Bank Credit Date', label: 'Bank Credit Date' },
          { value: 'Pending', label: 'Pending' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All' && values.searchByDateType !== 'Pending',
        visibleWhen: (values) => values.searchByDateType !== 'All' && values.searchByDateType !== 'Pending',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All' && values.searchByDateType !== 'Pending',
        visibleWhen: (values) => values.searchByDateType !== 'All' && values.searchByDateType !== 'Pending',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),
      createFilterField('SearchBy', 'Search By', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Shipper Invoice No', label: 'Shipper Invoice No' },
          { value: 'Vessel Name', label: 'Vessel Name' },
          { value: 'Flight No', label: 'Flight No' },
          { value: 'Remarks', label: 'Remarks' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('SearchValue', 'Search Value', FilterFieldType.TEXT, {
        placeholder: 'Enter search value',
        required: true,
        enabledWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
        visibleWhen: (values) => values.SearchBy && values.SearchBy !== 'All',
      }),
      createFilterField('modeOfPayment', 'Mode of Payment', FilterFieldType.SELECT, {
        staticOptions: [{ value: 'All', label: 'All' }],
        defaultValue: 'All',
      }),
      createFilterField('bankDetails', 'Bank details', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'WOORI BANK', label: 'WOORI BANK' },
          { value: 'RBL BANK', label: 'RBL BANK' },
        ],
        defaultValue: 'All',
      }),
    ],
    columnConfig: [
      createColumnConfig('sno', 'S.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('consigneeName', 'Consignee Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('linerName', 'Liner Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('modeOfPayment', 'Mode of Payment', { sortable: false, visibleByDefault: true }),
      createColumnConfig('bankDetails', 'Bank Details', { sortable: false, visibleByDefault: true }),
      createColumnConfig('refNo', 'Ref No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('amount', 'Amount', { sortable: true, visibleByDefault: true }),
      createColumnConfig('issueDate', 'Issue Date', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 7: PENDING FOR QUERY REPORT
// ============================================
export const pendingForQueryReport = createReportDefinition(
  'pendingForQuery',
  'Pending for Query Report',
  '/reports/pending-for-query',
  {
    headerColor: '#ffc107', // Yellow
    pageSize: 50,
    apiEndpoint: '/pending-query', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'ALL' },
          { value: 'INVOICE_DATE', label: 'Invoice Date' },
        ],
        defaultValue: 'ALL',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy PHP list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),

    ],
    columnConfig: [
      createColumnConfig('slNo', 'Sl.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('invoiceDate', 'Invoice Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('masterNumber', 'Master Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('houseNumber', 'House Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('partyName', 'Party Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('noOfDays', 'No.of.Days', { sortable: true, visibleByDefault: true }),
      createColumnConfig('income', 'Income', { sortable: true, visibleByDefault: true }),
      createColumnConfig('expense', 'Expense', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profit', 'Profit', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profitPercent', 'Profit %', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 8: JOB CLOSE PENDING REPORT
// ============================================
export const jobClosePendingReport = createReportDefinition(
  'jobClosePending',
  'Job Cost Pending Report',
  '/reports/job-close-pending',
  {
    headerColor: '#dc3545', // Red
    pageSize: 50,
    apiEndpoint: '/job-close-pending', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'ALL', label: 'ALL' },
          { value: 'INVOICE_DATE', label: 'Invoice Date' },
        ],
        defaultValue: 'ALL',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'ALL',
        visibleWhen: (values) => values.searchByDateType !== 'ALL',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy PHP list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),

    ],
    columnConfig: [
      createColumnConfig('slNo', 'Sl.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('invoiceDate', 'Invoice Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('masterNumber', 'Master Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('houseNumber', 'House Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('partyName', 'Party Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('noOfDays', 'No.of.Days', { sortable: true, visibleByDefault: true }),
      createColumnConfig('income', 'Income', { sortable: true, visibleByDefault: true }),
      createColumnConfig('expense', 'Expense', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profit', 'Profit', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profitPercent', 'Profit %', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 9: JOB COSTING REPORT
// ============================================
export const jobCostingReport = createReportDefinition(
  'jobCosting',
  'Job Cost Report',
  '/reports/job-costing',
  {
    headerColor: '#007bff', // Blue
    pageSize: 50,
    apiEndpoint: '/job-costing', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'All', label: 'All' },
          { value: 'Job Close Date', label: 'Job Close Date' },
        ],
        defaultValue: 'All',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: (values) => values.searchByDateType !== 'All',
        visibleWhen: (values) => values.searchByDateType !== 'All',
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        staticOptions: [{ value: 'All', label: 'All' }],
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),

    ],
    columnConfig: [
      createColumnConfig('slNo', 'Sl.No', { sortable: false, visibleByDefault: true }),
      createColumnConfig('jobCloseDate', 'Job Close Date', { sortable: true, visibleByDefault: true }),
      createColumnConfig('jobno', 'Jobno', { sortable: true, visibleByDefault: true }),
      createColumnConfig('houseNumber', 'House Number', { sortable: false, visibleByDefault: true }),
      createColumnConfig('partyName', 'Party Name', { sortable: true, visibleByDefault: true }),
      createColumnConfig('income', 'Income', { sortable: true, visibleByDefault: true }),
      createColumnConfig('expense', 'Expense', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profit', 'Profit', { sortable: true, visibleByDefault: true }),
      createColumnConfig('profitPercent', 'Profit %', { sortable: true, visibleByDefault: true }),
    ],
  }
);

// ============================================
// REPORT 10: JOB COSTING HEAD DETAIL
// ============================================
export const jobCostingHeadDetailReport = createReportDefinition(
  'jobCostingHeadDetail',
  'Job Closed Head Wise Breakup',
  '/reports/job-costing-head-detail',
  {
    headerColor: '#007bff', // Blue
    pageSize: 50,
    apiEndpoint: '/job-costing-detail', // Backend endpoint
    supportsBulkStatus: false,
    supportsBulkDate: false,
    filterConfig: [
      createFilterField('searchByDateType', 'Search by date', FilterFieldType.SELECT, {
        staticOptions: [
          { value: 'Job Close Date', label: 'Job Close Date' },
        ],
        defaultValue: 'Job Close Date',
      }),
      createFilterField('fromDate', 'From', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: () => true, // Always enabled since there's no ALL option
        visibleWhen: () => true, // Always visible since there's no ALL option
      }),
      createFilterField('toDate', 'To', FilterFieldType.DATERANGE, {
        required: false,
        enabledWhen: () => true, // Always enabled since there's no ALL option
        visibleWhen: () => true, // Always visible since there's no ALL option
      }),
      createFilterField('houseNo', 'House No', FilterFieldType.TEXT, {
        placeholder: 'Enter House No',
      }),
      createFilterField('branch', 'Branch', FilterFieldType.SELECT, {
        // Static fallback (legacy PHP list); backend endpoint may supply live data
        staticOptions: [
          { value: 'HEAD OFFICE', label: 'HEAD OFFICE' },
          { value: 'ANATHAPUR', label: 'ANATHAPUR' },
          { value: 'BANGALORE', label: 'BANGALORE' },
          { value: 'MUMBAI', label: 'MUMBAI' },
          { value: 'NEW DELHI', label: 'NEW DELHI' },
          { value: 'BLR SALES', label: 'BLR SALES' },
          { value: 'All', label: 'All' },
        ],
        optionsEndpoint: '/logistics-reports/filters/branches',
        defaultValue: 'All',
      }),
      createFilterField('jobNo', 'Job No', FilterFieldType.TEXT, {
        placeholder: 'Enter Job No',
      }),

    ],
    columnConfig: [
      // Column config will depend on the actual data structure for head-wise breakup
      // This is typically a more complex report that may need custom rendering
    ],
  }
);

// ============================================
// ALL REPORTS LIST
// ============================================
export const allReports = [
  clearancePendingReport,
  invoicePendingReport,
  despatchPendingReport,
  invoiceReport,
  blSearchReport,
  depositRefundReport,
  pendingForQueryReport,
  jobClosePendingReport,
  jobCostingReport,
  jobCostingHeadDetailReport,
];

// Helper to get report by ID
export const getReportById = (id) => allReports.find((r) => r.id === id);

// Helper to get report by path
export const getReportByPath = (path) => allReports.find((r) => r.path === path);

