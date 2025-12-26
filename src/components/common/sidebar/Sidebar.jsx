/** FULL UPDATED SIDEBAR — improved active styling (parent vs exact submenu) **/

import { clearAuth } from "../../../utils/auth";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "bootstrap";

import {
  ChevronRight,
  ChevronLeft,
  HouseDoor,
  Box,
  Cart,
  Bag,
  BarChart,
  Folder,
  Puzzle,
  List,
  X,
  BoxArrowRight,
  Speedometer2,
  FileText,
  ChatDots,
  Bank,
  GraphUp,
} from "react-bootstrap-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlaneArrival,
  faPlaneDeparture,
  faShip,
} from "@fortawesome/free-solid-svg-icons";

import { faCircle } from "@fortawesome/free-solid-svg-icons";

import "../../../styles/Sidebar.css";

/** ACTIVE PATH HANDLER **/
const isPathActive = (itemPath, currentPath, itemChildren = []) => {
  if (!itemPath || !currentPath) {
    if (itemChildren?.length) {
      return itemChildren.some((child) =>
        isPathActive(child.path, currentPath, child.children)
      );
    }
    return false;
  }

  if (currentPath === itemPath) return true;

  const nestedPaths = [
    "/air-inbound",
    "/air-outbound",
    "/ocean-inbound",
    "/ocean-outbound",
    "/sea-inbound",
    "/sea-outbound",
    "/reports",
    "/pe/air-inbound",
    "/pe/air-outbound",
    "/pe/ocean-inbound",
    "/pe/ocean-outbound",
    "/lom/air-inbound",
    "/lom/air-outbound",
    "/lom/sea-inbound",
    "/lom/sea-outbound",
    "/outstanding",
    "/estimates",
    "/daily-bank-status",
  ];

  for (const basePath of nestedPaths) {
    if (itemPath === basePath && currentPath.startsWith(basePath)) {
      return true;
    }
  }

  if (itemChildren?.length) {
    return itemChildren.some((child) =>
      isPathActive(child.path, currentPath, child.children)
    );
  }

  return false;
};

/** Determine exact vs descendant active **/
const getActiveVariant = (item, currentPath) => {
  const exact = !!item?.path && currentPath === item.path;
  const active = isPathActive(item?.path, currentPath, item?.children);
  const descendant = !exact && active;
  return { exact, descendant, active: exact || descendant };
};

/** PARENT PATH RESOLVER **/
const findActiveParentIds = (navItems, currentPath, parentIds = []) => {
  for (const item of navItems) {
    if (item.children?.length) {
      const newParentIds = [...parentIds, item.id];
      const hasActiveChild = item.children.some((child) =>
        isPathActive(child.path, currentPath, child.children)
      );
      if (hasActiveChild) {
        const nested = findActiveParentIds(
          item.children,
          currentPath,
          newParentIds
        );
        return nested.length > 0 ? nested : newParentIds;
      }
    }
  }
  return [];
};

/** ============================================================
 *  NAVIGATION STRUCTURE
 * ============================================================ **/
const NAV = [
  { id: "home", name: "Home", icon: <HouseDoor size={18} />, path: "/" },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <Speedometer2 size={18} />,
    path: "/dashboard",
  },

  {
    id: "freight-forwarding",
    name: "Freight Forwarding",
    icon: <Folder size={18} />,
    children: [
      {
        id: "ff-commercial",
        name: "Commercial",
        children: [
          {
            id: "ff-commercial-air-inbound",
            name: "Air Inbound",
            path: "/air-inbound",
            icon: <FontAwesomeIcon icon={faPlaneArrival} size="sm" />,
          },
          {
            id: "ff-commercial-air-outbound",
            name: "Air Outbound",
            path: "/air-outbound",
            icon: <FontAwesomeIcon icon={faPlaneDeparture} size="sm" />,
          },
          {
            id: "ff-commercial-sea-inbound",
            name: "Sea Inbound",
            path: "/ocean-inbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
          {
            id: "ff-commercial-sea-outbound",
            name: "Sea Outbound",
            path: "/ocean-outbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
        ],
      },

      {
        id: "ff-personal-effects",
        name: "Personal Effects (UB)",
        children: [
          {
            id: "ff-pe-air-inbound",
            name: "Air Inbound",
            path: "/pe/air-inbound",
            icon: <FontAwesomeIcon icon={faPlaneArrival} size="sm" />,
          },
          {
            id: "ff-pe-air-outbound",
            name: "Air Outbound",
            path: "/pe/air-outbound",
            icon: <FontAwesomeIcon icon={faPlaneDeparture} size="sm" />,
          },
          {
            id: "ff-pe-sea-inbound",
            name: "Sea Inbound",
            path: "/pe/ocean-inbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
          {
            id: "ff-pe-sea-outbound",
            name: "Sea Outbound",
            path: "/pe/ocean-outbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
        ],
      },
      {
        id: "ff-vas",
        name: "Value Added Services (VAS)",
        path: "/vas",
        // icon: <Folder size={18} />,
      },
      {
        id: "ff-lom-supply-chain",
        name: "LOM Supply Chain",
        children: [
          {
            id: "ff-lom-air-inbound",
            name: "Air Inbound",
            path: "/lom/air-inbound",
            icon: <FontAwesomeIcon icon={faPlaneArrival} size="sm" />,
          },
          {
            id: "ff-lom-air-outbound",
            name: "Air Outbound",
            path: "/lom/air-outbound",
            icon: <FontAwesomeIcon icon={faPlaneDeparture} size="sm" />,
          },
          {
            id: "ff-lom-sea-inbound",
            name: "Sea Inbound",
            path: "/lom/ocean-inbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
          {
            id: "ff-lom-sea-outbound",
            name: "Sea Outbound",
            path: "/lom/ocean-outbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
        ],
      },



      {
        id: "ff-logistics-report",
        name: "Reports",
        children: [
          { id: "lr-cp", name: "Clearance Pending", path: "/reports/clearance-pending" },
          { id: "lr-ip", name: "Invoice Pending", path: "/reports/invoice-pending" },
          { id: "lr-dp", name: "Despatch Pending", path: "/reports/despatch-pending" },
          { id: "lr-inv", name: "Invoice", path: "/reports/invoice" },
          { id: "lr-bl", name: "BL Search", path: "/reports/bl-search" },
          { id: "lr-dep", name: "Deposit Refund", path: "/reports/deposit-refund" },
          { id: "lr-pfq", name: "Pending For Query", path: "/reports/pending-for-query" },
          { id: "lr-jcp", name: "Job Close Pending", path: "/reports/job-close-pending" },
          { id: "lr-jc", name: "Job Costing", path: "/reports/job-costing" },
          { id: "lr-jch", name: "Job Costing Head Detail", path: "/reports/job-costing-head-detail" },
          { id: "lr-ds", name: "Daily Status", path: "/reports/daily-status" },
        ],
      },


      {
        id: "ff-estimates",
        name: "Estimates",
        icon: <FileText size={18} />,
        children: [
          { id: "est-quotation-n", name: "Quotation Management (N)", path: "/estimates/quotation-n" },
          { id: "est-quotation-o", name: "Quotation Management (O)", path: "/estimates/quotation-o" },
        ],
      },

      {
        id: "ff-config-masters",
        name: "Config Masters",
        icon: <Folder size={18} />,
        children: [
          {
            id: "config-currency",
            name: "Currency Master",
            path: "/currency-master",
            icon: <FontAwesomeIcon icon={faCircle} size="sm" />,
          },
          {
            id: "config-exchange",
            name: "Exchange Rate",
            path: "/exchange-rate",
            icon: <FontAwesomeIcon icon={faCircle} size="sm" />,
          },
          {
            id: "config-services",
            name: "List of Service",
            path: "/service-code",
            icon: <FontAwesomeIcon icon={faCircle} size="sm" />,
          },
        ],
      },


      {
        id: "ff-daily-bank-status",
        name: "Daily Bank Status",
        icon: <Bank size={18} />,
        children: [
          { id: "dbs-entry", name: "Entry", path: "/daily-bank-status/entry" },
          { id: "dbs-report", name: "Report", path: "/daily-bank-status/report" },
          { id: "dbs-deposits", name: "Deposit/Refund", path: "/daily-bank-status/deposits" },
        ],
      },

      {
        id: "ff-outstanding-mgmt",
        name: "Outstanding MGMT",
        icon: <GraphUp size={18} />,
        children: [
          { id: "om-ledger", name: "Ledger Outstanding", path: "/outstanding/ledger" },
          { id: "om-summary", name: "Outstanding Summary", path: "/outstanding/summary" },
          { id: "om-summary-report", name: "Summary Report", path: "/outstanding/summary-report" },
          { id: "om-sac-summary", name: "Summary SAC Report", path: "/outstanding/sac-summary" },
          { id: "om-party-wise", name: "Party wise Summary Rep", path: "/outstanding/party-wise" },
          { id: "om-invoice-tracking", name: "Invoice Tracking", path: "/outstanding/invoice-tracking" },
          { id: "om-opening-balances", name: "Opening Balances", path: "/outstanding/opening-balances" },
        ],
      },



      {
        id: "ff-documents-ocr",
        name: "Documents to OCR",
        icon: <Folder size={18} />,
        path: "/documents",
      },
    ],
  },

  {
    id: "user-management",
    name: "User Management",
    icon: <Puzzle size={18} />,
    path: "/user-management",
  },

  {
    id: "finance",
    name: "Finance",
    icon: <BarChart size={18} />,
    children: [
      {
        id: "finance-item",
        name: "Item",
        icon: <Box size={18} />,
        children: [{ id: "finance-item-list", name: "Items", path: "/items", plusPath: "/newitem" }],
      },
      {
        id: "finance-sales",
        name: "Sales",
        icon: <Cart size={18} />,
        children: [
          { id: "finance-sales-customers", name: "Customers", path: "/viewcustomer", plusPath: "/newcustomer" },
          { id: "finance-sales-quotes", name: "Quotes", path: "/quotes", plusPath: "/newquotes" },
          { id: "finance-sales-orders", name: "Sales Orders", path: "/salesorders", plusPath: "/newsalesorder" },
          { id: "finance-sales-invoices", name: "Invoices", path: "/invoices", plusPath: "/newinvoice" },
          { id: "finance-sales-recurring", name: "Recurring Invoices", path: "/recurring", plusPath: "/newcurring" },
          { id: "finance-sales-challans", name: "Delivery Challans", path: "/deliverychallans", plusPath: "/newdeliverychallan" },
          { id: "finance-sales-payments", name: "Payments Received", path: "/payments", plusPath: "/recordpayment" },
          { id: "finance-sales-credits", name: "Credit Notes", path: "/creditnotes", plusPath: "/newcreditnotes" },
        ],
      },
      {
        id: "finance-purchase",
        name: "Purchase",
        icon: <Bag size={18} />,
        children: [
          { id: "finance-purchase-vendors", name: "Vendors", path: "/vendors", plusPath: "/newvendor" },
          { id: "finance-purchase-expenses", name: "Expenses", path: "/expenses", plusPath: "/newexpense" },
          { id: "finance-purchase-recurring-expenses", name: "Recurring Expenses", path: "/recurringexpenses", plusPath: "/newrecurringexpense" },
          { id: "finance-purchase-orders", name: "Purchase Orders", path: "/purchaseorders", plusPath: "/newpurchaseorder" },
          { id: "finance-purchase-receives", name: "Purchase Receives", path: "/purchasereceives", plusPath: "/newpurchasereceive" },
          { id: "finance-purchase-bills", name: "Bills", path: "/bills", plusPath: "/newbill" },
          { id: "finance-purchase-recurring-bills", name: "Recurring Bills", path: "/recurringbills", plusPath: "/newrecurringbill" },
          { id: "finance-purchase-payments", name: "Payments Made", path: "/paymentsmade", plusPath: "/newpaymentmade" },
          { id: "finance-purchase-credits", name: "Vendor Credits", path: "/vendorcredits", plusPath: "/newvendorcredit" },
        ],
      },
      {
        id: "finance-accounting-reports",
        name: "Accounting Reports",
        icon: <BarChart size={18} />,
        children: [{ id: "finance-accounting-reports-main", name: "Reports", path: "/reports" }],
      },
    ],
  },

  {
    id: "ask-assistant",
    name: "Ask Assistant",
    icon: <ChatDots size={18} />,
    path: "/ask-assistant",
  },
];

/** ============================================================
 *  RECURSIVE NAV RENDERER
 * ============================================================ **/
const NavItem = ({
  item,
  depth = 0,
  isCollapsed,
  openIds,
  onToggle,
  currentPath,
  navigate,
  setIsMobileOpen,
}) => {
  const hasChildren = !!item?.children?.length;
  const isOpen = openIds.has(item.id);

  const { exact, descendant } = getActiveVariant(item, currentPath);

  const indentStyle = depth > 0 ? { paddingLeft: `${10 + depth * 16}px` } : {};

  const bgExact = "var(--sidebar-active, #1d4ed8)";
  const bgParent = "rgba(29, 78, 216, 0.22)"; // subtle parent highlight
  const textExact = "var(--sidebar-icon-active, #ffffff)";
  const textParent = "var(--sidebar-text, #e5e7eb)";
  const textIdle = "var(--sidebar-text-submenu, #d1d5db)";

  const handleClick = () => {
    if (isCollapsed) {
      if (item?.path) {
        try {
          navigate(item.path);
        } catch (e) {
          console.error("Navigation error:", e);
          navigate("/");
        }
      }
      return;
    }
    if (hasChildren) {
      onToggle(item.id);
      return;
    }
    if (item?.path) {
      try {
        navigate(item.path);
      } catch (e) {
        console.error("Navigation error:", e);
        navigate("/");
      }
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      <div
        className="d-flex align-items-center gap-2 py-1 px-2 mb-1 rounded-2"
        style={{
          ...indentStyle,
          backgroundColor: exact ? bgExact : descendant ? bgParent : "transparent",
          color: exact ? textExact : descendant ? textParent : textIdle,
        }}
        role="button"
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!exact && !descendant) {
            e.currentTarget.style.backgroundColor = "var(--sidebar-hover, #3a4254)";
            e.currentTarget.style.color = "var(--sidebar-text, #e5e7eb)";
          }
        }}
        onMouseLeave={(e) => {
          if (!exact && !descendant) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = textIdle;
          }
        }}
        {...(isCollapsed && item?.name
          ? {
            "data-bs-toggle": "tooltip",
            "data-bs-placement": "right",
            title: item.name,
          }
          : {})}
      >
        {/* Left active indicator ONLY for exact selected leaf/sub item */}
        {!isCollapsed && depth > 0 && (
          <span
            style={{
              width: "3px",
              height: "16px",
              borderRadius: "2px",
              backgroundColor: exact ? "#ffffff" : "transparent",
              opacity: exact ? 1 : 0,
              transition: "opacity .15s",
              marginRight: "6px",
            }}
          />
        )}

        {!isCollapsed && hasChildren && (
          <span
            className={isOpen ? "rotate-90" : ""}
            style={{ transition: "transform .2s", width: "14px" }}
          >
            <ChevronRight size={14} />
          </span>
        )}

        {!isCollapsed && !hasChildren && depth === 0 && (
          <span style={{ width: "14px" }} />
        )}

        <span
          style={{
            color: exact ? textExact : descendant ? textParent : "var(--sidebar-icon, #a0aec0)",
          }}
        >
          {item?.icon || <span style={{ width: "18px" }} />}
        </span>

        {!isCollapsed && <span>{item?.name || ""}</span>}
      </div>

      {!isCollapsed && hasChildren && isOpen && (
        <div>
          {(item?.children ?? []).map((child) => (
            <NavItem
              key={child.id}
              item={child}
              depth={depth + 1}
              isCollapsed={isCollapsed}
              openIds={openIds}
              onToggle={onToggle}
              currentPath={currentPath}
              navigate={navigate}
              setIsMobileOpen={setIsMobileOpen}
            />
          ))}
        </div>
      )}
    </>
  );
};

/** ============================================================
 *  MAIN SIDEBAR COMPONENT
 * ============================================================ **/
export default function Sidebar() {
  const [openIds, setOpenIds] = useState(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Simplified state model: isPinnedOpen + isHoverExpanded
  const [isPinnedOpen, setIsPinnedOpen] = useState(false); // User pinned sidebar open
  const [isHoverExpanded, setIsHoverExpanded] = useState(false); // Expanded due to hover

  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const tooltipsRef = useRef([]);

  // Derived value: sidebar is expanded if pinned OR hover-expanded
  const isExpanded = isPinnedOpen || isHoverExpanded;

  /** Auto-expand correct submenu **/
  useEffect(() => {
    const activeParentIds = findActiveParentIds(NAV, location.pathname);
    if (activeParentIds.length > 0) {
      setOpenIds(new Set(activeParentIds));
    }
  }, [location.pathname]);

  /** Initialize/destroy Bootstrap tooltips when collapse state changes **/
  useEffect(() => {
    const disposeTooltips = () => {
      tooltipsRef.current.forEach((t) => {
        try {
          t?.dispose?.();
        } catch {
          /* ignore */
        }
      });
      tooltipsRef.current = [];
    };

    disposeTooltips();

    // Only show tooltips when actually collapsed (not expanded)
    if (isExpanded) return;
    if (!sidebarRef.current) return;
    if (!Tooltip?.getOrCreateInstance) return;

    const initTimer = setTimeout(() => {
      if (!sidebarRef.current) return;

      try {
        const tooltipTriggers = sidebarRef.current.querySelectorAll(
          "[data-bs-toggle='tooltip']"
        );

        tooltipsRef.current = Array.from(tooltipTriggers)
          .filter((el) => el != null && document.body.contains(el))
          .map((el) => {
            try {
              return Tooltip.getOrCreateInstance(el, {
                placement: "right",
                trigger: "hover",
                container: "body",
              });
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      } catch {
        tooltipsRef.current = [];
      }
    }, 150);

    return () => {
      clearTimeout(initTimer);
      disposeTooltips();
    };
  }, [isExpanded]);

  const toggle = (id) => {
    setOpenIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleNavClick = (item) => {
    // Safe navigation with fallback
    if (!isExpanded) {
      if (item?.path) {
        try {
          navigate(item.path);
        } catch (e) {
          console.error("Navigation error:", e);
          navigate("/");
        }
      }
      return;
    }
    const children = item?.children ?? [];
    if (children.length > 0) {
      toggle(item.id);
      return;
    }
    if (item?.path) {
      try {
        navigate(item.path);
      } catch (e) {
        console.error("Navigation error:", e);
        navigate("/");
      }
    }
    setIsMobileOpen(false);
  };

  // Hover handlers for expand/collapse on hover
  const handleMouseEnter = () => {
    // Only expand on hover if NOT pinned open
    if (!isPinnedOpen) {
      setIsHoverExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    // Only collapse on hover leave if NOT pinned open
    if (!isPinnedOpen) {
      setIsHoverExpanded(false);
    }
  };

  // Toggle collapse with pin support
  const handleToggleCollapse = () => {
    if (isPinnedOpen) {
      // Currently pinned open -> collapse
      setIsPinnedOpen(false);
      setIsHoverExpanded(false); // Collapses immediately
    } else {
      // Currently collapsed -> pin open
      setIsPinnedOpen(true);
      setIsHoverExpanded(false); // Hover no longer needed
    }
  };

  return (
    <>
      <button
        className="btn btn-light d-lg-none position-fixed m-2"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{ zIndex: 2001 }}
      >
        {isMobileOpen ? <X size={22} /> : <List size={22} />}
      </button>

      {isMobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1999 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        className={`sidebar_block border-end d-flex flex-column 
          ${!isExpanded ? "sidebar--collapsed" : ""} 
          ${isMobileOpen ? "active" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="d-none d-lg-flex justify-content-end p-2 border-bottom">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleToggleCollapse}
            style={{
              backgroundColor: "transparent",
              borderColor: "var(--sidebar-border, #3a4254)",
              color: "var(--sidebar-text, #e5e7eb)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--sidebar-hover, #3a4254)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {!isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <ul className="nav flex-column mt-2">
          {/* Section 1: Home + Dashboard */}
          {NAV.slice(0, 2).map((item) => {
            const { exact, descendant } = getActiveVariant(item, location.pathname);
            const bgExact = "bg-primary";
            const bgDesc = "bg-primary bg-opacity-25";
            const children = item?.children ?? [];

            return (
              <li key={item.id} className="nav-item mb-1">
                <button
                  className={`nav-link w-100 d-flex align-items-center ${!isExpanded ? "justify-content-center" : "gap-2 px-3"
                    } py-2 border-0 rounded-0 ${exact ? bgExact : descendant ? bgDesc : ""}`}
                  onClick={() => handleNavClick(item)}
                  style={{
                    color: exact || descendant ? "#fff" : "var(--sidebar-text, #fff)",
                  }}
                  {...(!isExpanded
                    ? {
                      "data-bs-toggle": "tooltip",
                      "data-bs-placement": "right",
                      title: item?.name || "",
                    }
                    : {})}
                >
                  {isExpanded && (
                    <span
                      className={`${children.length > 0 ? "" : "invisible"} ${openIds.has(item.id) ? "rotate-90" : ""
                        }`}
                      style={{ transition: "transform .2s" }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}

                  <span
                    style={{
                      color: exact || descendant
                        ? "var(--sidebar-icon-active, #ffffff)"
                        : "var(--sidebar-icon, #a0aec0)",
                    }}
                  >
                    {item?.icon || <span style={{ width: "18px" }} />}
                  </span>

                  {isExpanded && <span>{item?.name || ""}</span>}
                </button>

                {isExpanded && children.length > 0 && openIds.has(item.id) && (
                  <div className="collapse show">
                    <div className="list-unstyled ms-2 my-1">
                      {children.map((child) => (
                        <NavItem
                          key={child.id}
                          item={child}
                          depth={0}
                          isCollapsed={!isExpanded}
                          openIds={openIds}
                          onToggle={toggle}
                          currentPath={location.pathname}
                          navigate={navigate}
                          setIsMobileOpen={setIsMobileOpen}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {/* Divider after Dashboard */}
          <hr className="my-2 border-top opacity-50" style={{ borderColor: "var(--sidebar-border, #3a4254)" }} />

          {/* Section 2: Freight Forwarding */}
          {NAV.slice(2, 3).map((item) => {
            const { exact, descendant } = getActiveVariant(item, location.pathname);
            const bgExact = "bg-primary";
            const bgDesc = "bg-primary bg-opacity-25";
            const children = item?.children ?? [];

            return (
              <li key={item.id} className="nav-item mb-1">
                <button
                  className={`nav-link w-100 d-flex align-items-center ${!isExpanded ? "justify-content-center" : "gap-2 px-3"
                    } py-2 border-0 rounded-0 ${exact ? bgExact : descendant ? bgDesc : ""}`}
                  onClick={() => handleNavClick(item)}
                  style={{
                    color: exact || descendant ? "#ffffff" : "var(--sidebar-text, #e5e7eb)",
                  }}
                  {...(!isExpanded
                    ? {
                      "data-bs-toggle": "tooltip",
                      "data-bs-placement": "right",
                      title: item?.name || "",
                    }
                    : {})}
                >
                  {isExpanded && (
                    <span
                      className={`${children.length > 0 ? "" : "invisible"} ${openIds.has(item.id) ? "rotate-90" : ""
                        }`}
                      style={{ transition: "transform .2s" }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}

                  <span
                    style={{
                      color: exact || descendant
                        ? "var(--sidebar-icon-active, #ffffff)"
                        : "var(--sidebar-icon, #a0aec0)",
                    }}
                  >
                    {item?.icon || <span style={{ width: "18px" }} />}
                  </span>

                  {isExpanded && <span>{item?.name || ""}</span>}
                </button>

                {isExpanded && children.length > 0 && openIds.has(item.id) && (
                  <div className="collapse show">
                    <div className="list-unstyled ms-2 my-1">
                      {children.map((child) => (
                        <NavItem
                          key={child.id}
                          item={child}
                          depth={0}
                          isCollapsed={!isExpanded}
                          openIds={openIds}
                          onToggle={toggle}
                          currentPath={location.pathname}
                          navigate={navigate}
                          setIsMobileOpen={setIsMobileOpen}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {/* Divider after Freight Forwarding */}
          <hr className="my-2 border-top opacity-50" style={{ borderColor: "var(--sidebar-border, #3a4254)" }} />

          {/* Remaining items */}
          {NAV.slice(3).map((item) => {
            const { exact, descendant } = getActiveVariant(item, location.pathname);
            const bgExact = "bg-primary";
            const bgDesc = "bg-primary bg-opacity-25";
            const children = item?.children ?? [];

            return (
              <li key={item.id} className="nav-item mb-1">
                <button
                  className={`nav-link w-100 d-flex align-items-center ${!isExpanded ? "justify-content-center" : "gap-2 px-3"
                    } py-2 border-0 rounded-0 ${exact ? bgExact : descendant ? bgDesc : ""}`}
                  onClick={() => handleNavClick(item)}
                  style={{
                    color: exact || descendant ? "#ffffff" : "var(--sidebar-text, #e5e7eb)",
                  }}
                  {...(!isExpanded
                    ? {
                      "data-bs-toggle": "tooltip",
                      "data-bs-placement": "right",
                      title: item?.name || "",
                    }
                    : {})}
                >
                  {isExpanded && (
                    <span
                      className={`${children.length > 0 ? "" : "invisible"} ${openIds.has(item.id) ? "rotate-90" : ""
                        }`}
                      style={{ transition: "transform .2s" }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}

                  <span
                    style={{
                      color: exact || descendant
                        ? "var(--sidebar-icon-active, #ffffff)"
                        : "var(--sidebar-icon, #a0aec0)",
                    }}
                  >
                    {item?.icon || <span style={{ width: "18px" }} />}
                  </span>

                  {isExpanded && <span>{item?.name || ""}</span>}
                </button>

                {isExpanded && children.length > 0 && openIds.has(item.id) && (
                  <div className="collapse show">
                    <div className="list-unstyled ms-2 my-1">
                      {children.map((child) => (
                        <NavItem
                          key={child.id}
                          item={child}
                          depth={0}
                          isCollapsed={!isExpanded}
                          openIds={openIds}
                          onToggle={toggle}
                          currentPath={location.pathname}
                          navigate={navigate}
                          setIsMobileOpen={setIsMobileOpen}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-auto w-100 border-top py-3 px-3">
          <button
            className="btn d-flex align-items-center gap-2 w-100 border-0"
            style={{
              backgroundColor: "transparent",
              color: "var(--sidebar-text, #e5e7eb)",
            }}
            onClick={() => {
              sessionStorage.clear();
              clearAuth();
              window.location.hash = "#/";
              window.location.reload();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--sidebar-hover, #3a4254)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            {...(!isExpanded
              ? {
                "data-bs-toggle": "tooltip",
                "data-bs-placement": "right",
                title: "Logout",
              }
              : {})}
          >
            <BoxArrowRight size={18} />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
