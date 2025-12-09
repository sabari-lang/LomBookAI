import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FilterFieldType } from '../types/reportTypes';
import { fetchFilterOptions } from '../api/reportsApi';

/**
 * Generic Report Filters Component
 * Renders filter fields based on configuration
 */
const ReportFilters = ({
  filterConfig = [],
  values = {},
  onChange = () => {},
  onResult = () => {},
  onReset = () => {},
  onRefresh = () => {},
  loading = false,
  hasSearched = false,
  errors = {},
}) => {
  // Get fields that need dynamic options
  const dynamicFields = useMemo(() => {
    return filterConfig.filter((field) => field.optionsEndpoint && !field.staticOptions);
  }, [filterConfig]);

  // Fetch all dynamic options in parallel using Promise.all
  // Using useQuery with a combined query key
  const endpoints = useMemo(() => 
    dynamicFields.map((field) => field.optionsEndpoint).filter(Boolean),
    [dynamicFields]
  );

  const { data: allOptionsData } = useQuery({
    queryKey: ['filterOptions', endpoints],
    queryFn: async () => {
      const results = await Promise.all(
        endpoints.map((endpoint) => fetchFilterOptions(endpoint))
      );
      const optionsMap = {};
      dynamicFields.forEach((field, index) => {
        if (field.optionsEndpoint === endpoints[index]) {
          optionsMap[field.key] = results[index] || [];
        }
      });
      return optionsMap;
    },
    enabled: endpoints.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const dynamicOptions = allOptionsData || {};

  // Get options for a field (static or dynamic)
  const getOptions = (field) => {
    if (field.staticOptions && field.staticOptions.length > 0) {
      return field.staticOptions;
    }
    if (dynamicOptions[field.key]) {
      return dynamicOptions[field.key];
    }
    return [];
  };

  // Check if field should be visible
  const isVisible = (field) => {
    if (!field.visibleWhen) return true;
    return field.visibleWhen(values);
  };

  // Check if field should be enabled
  const isEnabled = (field) => {
    if (!field.enabledWhen) return true;
    return field.enabledWhen(values);
  };

  // Check if field is required
  const isRequired = (field) => {
    if (!field.required) return false;
    if (field.enabledWhen) {
      return field.enabledWhen(values);
    }
    return field.required;
  };

  // Handle field value change
  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  // Validate filters
  const validate = () => {
    const newErrors = {};

    filterConfig.forEach((field) => {
      if (!isVisible(field) || !isEnabled(field)) return;

      if (isRequired(field) && !values[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }

      // Date range validation
      if (field.type === FilterFieldType.DATERANGE) {
        if (field.key === 'fromDate' && values.fromDate && values.toDate) {
          if (new Date(values.fromDate) > new Date(values.toDate)) {
            newErrors.fromDate = 'From date must be less than or equal to To date';
          }
        }
      }
    });

    return newErrors;
  };

  // Handle Result button click
  const handleResult = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      // Errors will be shown inline
      return;
    }
    onResult(values);
  };

  // Render a single filter field
  const renderField = (field) => {
    if (!isVisible(field)) return null;

    const fieldValue = values[field.key] || field.defaultValue || '';
    const fieldError = errors[field.key];
    const disabled = !isEnabled(field);
    const required = isRequired(field);

    switch (field.type) {
      case FilterFieldType.SELECT:
        return (
          <div key={field.key} className="mb-3">
            <label className="form-label small fw-semibold">
              {field.label}
              {required && <span className="text-danger">*</span>}
            </label>
            <select
              className={`form-select form-select-sm ${fieldError ? 'is-invalid' : ''}`}
              value={fieldValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
              disabled={disabled}
            >
              {getOptions(field).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldError && <div className="text-danger small mt-1">{fieldError}</div>}
          </div>
        );

      case FilterFieldType.DATERANGE:
        return (
          <div key={field.key} className="mb-3">
            <label className="form-label small fw-semibold">
              {field.label}
              {required && <span className="text-danger">*</span>}
            </label>
            <DatePicker
              selected={fieldValue ? new Date(fieldValue) : null}
              onChange={(date) => {
                const dateStr = date ? date.toISOString().split('T')[0] : '';
                handleChange(field.key, dateStr);
              }}
              dateFormat="dd-MM-yyyy"
              placeholderText="dd-mm-yyyy"
              className={`form-control form-control-sm ${fieldError ? 'is-invalid' : ''}`}
              disabled={disabled}
              showYearDropdown
              dropdownMode="select"
            />
            {fieldError && <div className="text-danger small mt-1">{fieldError}</div>}
          </div>
        );

      case FilterFieldType.TEXT:
        return (
          <div key={field.key} className="mb-3">
            <label className="form-label small fw-semibold">
              {field.label}
              {required && <span className="text-danger">*</span>}
            </label>
            <input
              type="text"
              className={`form-control form-control-sm ${fieldError ? 'is-invalid' : ''}`}
              value={fieldValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
            />
            {fieldError && <div className="text-danger small mt-1">{fieldError}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  // Group fields into rows (3-4 fields per row)
  const groupFieldsIntoRows = () => {
    const visibleFields = filterConfig.filter((f) => isVisible(f));
    const rows = [];
    const fieldsPerRow = 4;

    for (let i = 0; i < visibleFields.length; i += fieldsPerRow) {
      rows.push(visibleFields.slice(i, i + fieldsPerRow));
    }

    return rows;
  };

  const rows = groupFieldsIntoRows();

  return (
    <div className="bg-white p-3 rounded shadow-sm">
      {rows.map((rowFields, rowIndex) => (
        <div key={rowIndex} className="row g-3 mb-2">
          {rowFields.map((field) => (
            <div key={field.key} className="col-md-3">
              {renderField(field)}
            </div>
          ))}
        </div>
      ))}

      {/* Action Buttons */}
      <div className="d-flex gap-2 mt-3">
        <button
          type="button"
          className="btn btn-sm"
          style={{ backgroundColor: '#17a2b8', color: 'white' }}
          onClick={(e) => {
            e.preventDefault();
            handleResult();
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Loading...
            </>
          ) : (
            'Result'
          )}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={(e) => {
            e.preventDefault();
            onReset();
          }}
          disabled={false}
        >
          Reset
        </button>
        <button
          type="button"
          className="btn btn-sm"
          style={{ backgroundColor: '#17a2b8', color: 'white' }}
          onClick={(e) => {
            e.preventDefault();
            onRefresh();
          }}
          disabled={loading || !hasSearched}
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default ReportFilters;

