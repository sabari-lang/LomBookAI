import { useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Route-based fallback mapping
 * Maps path prefixes to their logical parent/list routes
 */
const FALLBACK_MAP = [
  // Logistics Air Inbound
  { pattern: /^\/air-inbound\/masterreport\/housereport/, fallback: "/air-inbound/masterreport" },
  { pattern: /^\/air-inbound\/masterreport/, fallback: "/air-inbound" },
  { pattern: /^\/air-inbound/, fallback: "/" },
  
  // Logistics Air Outbound
  { pattern: /^\/air-outbound\/masterreport\/housereport/, fallback: "/air-outbound/masterreport" },
  { pattern: /^\/air-outbound\/masterreport/, fallback: "/air-outbound" },
  { pattern: /^\/air-outbound/, fallback: "/" },
  
  // Logistics Sea/Ocean Inbound
  { pattern: /^\/sea-inbound\/masterreport\/housereport/, fallback: "/sea-inbound/masterreport" },
  { pattern: /^\/sea-inbound\/masterreport/, fallback: "/sea-inbound" },
  { pattern: /^\/sea-inbound/, fallback: "/" },
  { pattern: /^\/ocean-inbound/, fallback: "/" },
  
  // Logistics Sea/Ocean Outbound
  { pattern: /^\/sea-outbound\/masterreport\/housereport/, fallback: "/sea-outbound/masterreport" },
  { pattern: /^\/sea-outbound\/masterreport/, fallback: "/sea-outbound" },
  { pattern: /^\/sea-outbound/, fallback: "/" },
  { pattern: /^\/ocean-outbound/, fallback: "/" },
  
  // Reports
  { pattern: /^\/reports\//, fallback: "/reports" },
  { pattern: /^\/reports$/, fallback: "/" },
  
  // Items
  { pattern: /^\/newitem/, fallback: "/items" },
  { pattern: /^\/items/, fallback: "/" },
  
  // Sales module
  { pattern: /^\/newcustomer/, fallback: "/viewcustomer" },
  { pattern: /^\/viewcustomer/, fallback: "/" },
  { pattern: /^\/newquotes/, fallback: "/quotes" },
  { pattern: /^\/quotes/, fallback: "/" },
  { pattern: /^\/newsalesorder/, fallback: "/salesorders" },
  { pattern: /^\/salesorders/, fallback: "/" },
  { pattern: /^\/newdeliverychallan/, fallback: "/deliverychallans" },
  { pattern: /^\/deliverychallans/, fallback: "/" },
  { pattern: /^\/newinvoice/, fallback: "/invoices" },
  { pattern: /^\/invoices/, fallback: "/" },
  { pattern: /^\/newcreditnotes/, fallback: "/creditnotes" },
  { pattern: /^\/creditnotes/, fallback: "/" },
  { pattern: /^\/newcurring/, fallback: "/recurring" },
  { pattern: /^\/recurring/, fallback: "/" },
  { pattern: /^\/recordpayment/, fallback: "/payments" },
  { pattern: /^\/payments/, fallback: "/" },
  
  // Purchases module
  { pattern: /^\/newvendor/, fallback: "/vendors" },
  { pattern: /^\/vendors/, fallback: "/" },
  { pattern: /^\/newexpense/, fallback: "/expenses" },
  { pattern: /^\/expenses/, fallback: "/" },
  { pattern: /^\/newrecurringexpense/, fallback: "/recurringexpenses" },
  { pattern: /^\/recurringexpenses/, fallback: "/" },
  { pattern: /^\/newbill/, fallback: "/bills" },
  { pattern: /^\/bills/, fallback: "/" },
  { pattern: /^\/newrecurringbill/, fallback: "/recurringbills" },
  { pattern: /^\/recurringbills/, fallback: "/" },
  { pattern: /^\/newpaymentmade/, fallback: "/paymentsmade" },
  { pattern: /^\/paymentsmade/, fallback: "/" },
  { pattern: /^\/newvendorcredit/, fallback: "/vendorcredits" },
  { pattern: /^\/vendorcredits/, fallback: "/" },
  { pattern: /^\/newpurchasereceive/, fallback: "/purchasereceives" },
  { pattern: /^\/purchasereceives/, fallback: "/" },
  { pattern: /^\/newpurchaseorder/, fallback: "/purchaseorders" },
  { pattern: /^\/purchaseorders/, fallback: "/" },
  
  // Banking
  { pattern: /^\/addbank/, fallback: "/banking" },
  { pattern: /^\/banking/, fallback: "/" },
  
  // Documents
  { pattern: /^\/invoiceAgentForm/, fallback: "/documents" },
  { pattern: /^\/invoiceDownload/, fallback: "/documents" },
  { pattern: /^\/documents/, fallback: "/" },
  
  // Report downloads
  { pattern: /^\/downloadquote/, fallback: "/" },
  { pattern: /^\/sales-invoice/, fallback: "/" },
  { pattern: /^\/downloadsalesorder/, fallback: "/" },
  { pattern: /^\/delivery-challan-report/, fallback: "/" },
  { pattern: /^\/payment-received-report/, fallback: "/" },
  { pattern: /^\/credit-note-report/, fallback: "/" },
  { pattern: /^\/recurring-invoice-report/, fallback: "/" },
  { pattern: /^\/purchase-order-report/, fallback: "/" },
  { pattern: /^\/bill-report/, fallback: "/" },
  { pattern: /^\/recurring-bill-report/, fallback: "/" },
  { pattern: /^\/payment-made-report/, fallback: "/" },
  { pattern: /^\/vendor-credit-report/, fallback: "/" },
  
  // User management
  { pattern: /^\/user-management/, fallback: "/" },
  
  // Misc
  { pattern: /^\/day-book/, fallback: "/reports" },
  { pattern: /^\/all-transaction/, fallback: "/reports" },
  { pattern: /^\/bill-wise/, fallback: "/reports" },
  { pattern: /^\/ask-assistant/, fallback: "/" },
  { pattern: /^\/print-vendor-purchase/, fallback: "/" },
];

/**
 * Get the best fallback route for a given pathname
 * @param {string} pathname - Current pathname
 * @returns {string} - Fallback route
 */
export const getFallbackForPath = (pathname) => {
  // Check against fallback map
  for (const { pattern, fallback } of FALLBACK_MAP) {
    if (pattern.test(pathname)) {
      return fallback;
    }
  }
  
  // Generic fallback: try parent path
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    return "/" + segments.slice(0, -1).join("/");
  }
  
  // Ultimate fallback
  return "/";
};

/**
 * useAppBack Hook
 * 
 * Provides consistent back navigation behavior across the app.
 * - If browser history exists: navigate(-1)
 * - If no history (deep link / refresh / first page): navigate to smart fallback with replace
 * 
 * Usage:
 *   const { goBack, canGoBack } = useAppBack();
 *   <button onClick={() => goBack()}>Back</button>
 *   <button onClick={() => goBack("/custom-fallback")}>Back with custom fallback</button>
 */
export const useAppBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastEscRef = useRef(0);

  // Check if we can go back in browser history
  // window.history.state?.idx > 0 means there's a previous entry
  const canGoBack = typeof window !== "undefined" && 
    window.history.state?.idx > 0;

  const isAtRoot = location.pathname === "/" || location.pathname === "";

  /**
   * Navigate back or to fallback path
   * @param {string} [explicitFallback] - Optional explicit fallback path. 
   *                                       If not provided, uses smart fallback based on current path.
   * @returns {boolean} - Whether navigation was triggered
   */
  const goBack = useCallback((explicitFallback) => {
    // Don't navigate if already at root
    if (isAtRoot) return false;

    // Debounce protection (300ms)
    const now = Date.now();
    if (now - lastEscRef.current < 300) {
      return false;
    }
    lastEscRef.current = now;

    if (canGoBack) {
      navigate(-1);
    } else {
      // Use explicit fallback if provided, otherwise compute from current path
      const fallback = explicitFallback ?? getFallbackForPath(location.pathname);
      navigate(fallback, { replace: true });
    }
    return true;
  }, [canGoBack, isAtRoot, navigate, location.pathname]);

  return { goBack, canGoBack, isAtRoot };
};

export default useAppBack;
