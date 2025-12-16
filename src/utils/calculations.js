/**
 * Reusable calculation utilities for all forms
 * Production-ready, handles edge cases, rounding, and null safety
 */

/**
 * Calculate line item amount: (quantity × rate) - discount + tax
 * @param {Object} item - Item object with quantity, rate, discount, tax
 * @returns {number} - Calculated amount rounded to 2 decimals
 */
/**
 * Parse tax percentage from string like "GST 12%" to number 12.0
 * @param {string|number} taxValue - Tax value as string or number
 * @returns {number} - Parsed tax percentage as number
 */
export const parseTaxPercentage = (taxValue) => {
  if (typeof taxValue === "number") return taxValue;
  if (!taxValue || taxValue === "") return 0;
  const match = String(taxValue).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

export const calculateLineAmount = (item = {}) => {
  const qty = Number(item?.quantity) || 0;
  const rate = Number(item?.rate) || 0;
  const disc = Number(item?.discount) || 0;
  const tax = Number(item?.tax) || 0;

  // Base amount: quantity × rate
  const base = qty * rate;
  
  // Discount amount (percentage)
  const discountAmount = (base * disc) / 100;
  
  // Amount after discount
  const afterDiscount = base - discountAmount;
  
  // Tax amount (percentage on after-discount amount)
  const lineTax = (afterDiscount * tax) / 100;
  
  // Final amount: after discount + tax
  const final = afterDiscount + lineTax;
  
  return Math.round(final * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate subtotal from items array
 * @param {Array} items - Array of items
 * @returns {number} - Subtotal rounded to 2 decimals
 */
export const calculateSubtotal = (items = []) => {
  const total = items.reduce((acc, item) => {
    return acc + calculateLineAmount(item);
  }, 0);
  return Math.round(total * 100) / 100;
};

/**
 * Calculate tax amount based on type (TDS/TCS)
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate percentage
 * @param {string} taxType - "TDS" or "TCS"
 * @returns {number} - Tax amount (negative for TDS, positive for TCS)
 */
export const calculateTaxAmount = (subtotal = 0, taxRate = 0, taxType = "TDS") => {
  const rate = Number(taxRate) || 0;
  const amount = (subtotal * rate) / 100;
  return taxType === "TDS" ? -Math.round(amount * 100) / 100 : Math.round(amount * 100) / 100;
};

/**
 * Calculate discount amount
 * @param {number} amount - Base amount
 * @param {number} discountPercent - Discount percentage
 * @returns {number} - Discount amount rounded to 2 decimals
 */
export const calculateDiscountAmount = (amount = 0, discountPercent = 0) => {
  const percent = Number(discountPercent) || 0;
  const discount = (amount * percent) / 100;
  return Math.round(discount * 100) / 100;
};

/**
 * Calculate grand total
 * @param {number} subtotal - Subtotal
 * @param {number} taxAmount - Tax amount (can be negative for TDS)
 * @param {number} adjustment - Adjustment amount
 * @param {number} roundOff - Round off amount (optional)
 * @returns {number} - Grand total rounded to 2 decimals
 */
export const calculateGrandTotal = (subtotal = 0, taxAmount = 0, adjustment = 0, roundOff = 0) => {
  const total = subtotal + taxAmount + adjustment + roundOff;
  return Math.round(total * 100) / 100;
};

/**
 * Round off calculation
 * @param {number} amount - Amount to round
 * @param {string} mode - "No Rounding", "nearest", "floor", "ceil"
 * @returns {number} - Round off amount
 */
export const calculateRoundOff = (amount = 0, mode = "No Rounding") => {
  if (mode === "No Rounding") return 0;
  
  const rounded = 
    mode === "nearest" ? Math.round(amount) :
    mode === "floor" ? Math.floor(amount) :
    mode === "ceil" ? Math.ceil(amount) :
    amount;
  
  return Math.round((rounded - amount) * 100) / 100;
};

/**
 * Safe number conversion
 * @param {any} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} - Converted number or default
 */
export const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === "") return defaultValue;
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Safe string conversion
 * @param {any} value - Value to convert
 * @param {string} defaultValue - Default value
 * @returns {string} - Converted string or default
 */
export const toString = (value, defaultValue = "") => {
  if (value === null || value === undefined) return defaultValue;
  return String(value).trim();
};

/**
 * Format number to 2 decimal places
 * @param {number} value - Number to format
 * @returns {string} - Formatted string
 */
export const formatCurrency = (value = 0) => {
  return Number(value).toFixed(2);
};

