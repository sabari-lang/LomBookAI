import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  ChevronRight,
  HouseDoor,
  Box,
  Cart,
  Bag,
  BarChart,
  Folder,
  Puzzle,
  Plus,
  List,
  X,
  ChatDots,
  BoxArrowRight,
  Bank,
} from "react-bootstrap-icons";

// ⭐ FontAwesome Icons (matches your backend exactly)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlaneArrival,
  faPlaneDeparture,
  faShip,
} from "@fortawesome/free-solid-svg-icons";

import "../../../styles/Sidebar.css";

/* ============================================================
 *  SAFE NAV with FULL FALLBACK PROTECTION
 * ============================================================ */
const NAV =
  [
    { name: "Home", icon: <HouseDoor size={18} />, path: "/" },

    {
      name: "Items",
      icon: <Box size={18} />,
      children:
        [
          { name: "Items", path: "/items", plusPath: "/newitem" },
        ] || [],
    },

    {
      name: "Sales",
      icon: <Cart size={18} />,
      children:
        [
          { name: "Customers", path: "/viewcustomer", plusPath: "/newcustomer" },
          { name: "Quotes", path: "/quotes", plusPath: "/newquotes" },
          { name: "Sales Orders", path: "/salesorders", plusPath: "/newsalesorder" },
          { name: "Invoices", path: "/invoices", plusPath: "/newinvoice" },
          { name: "Recurring Invoices", path: "/recurring", plusPath: "/newcurring" },
          { name: "Delivery Challans", path: "/deliverychallans", plusPath: "/newdeliverychallan" },
          { name: "Payments Received", path: "/payments", plusPath: "/recordpayment" },
          { name: "Credit Notes", path: "/creditnotes", plusPath: "/newcreditnotes" },
          // { name: "e-Way Bills", path: "/e-way", plusPath: "/neweway" },
        ] || [],
    },

    {
      name: "Purchases",
      icon: <Bag size={18} />,
      children:
        [
          { name: "Vendors", path: "/vendors", plusPath: "/newvendor" },
          { name: "Expenses", path: "/expenses", plusPath: "/newexpense" },
          // { name: "Recurring Expenses", path: "/recurringexpenses", plusPath: "/newrecurringexpense" },
          { name: "Purchase Orders", path: "/purchaseorders", plusPath: "/newpurchaseorder" },
          // { name: "Purchase Receives", path: "/purchasereceives", plusPath: "/newpurchasereceive" },
          { name: "Bills", path: "/bills", plusPath: "/newbill" },
          { name: "Recurring Bills", path: "/recurringbills", plusPath: "/newrecurringbill" },
          { name: "Payments Made", path: "/paymentsmade", plusPath: "/newpaymentmade" },
          { name: "Vendor Credits", path: "/vendorcredits", plusPath: "/newvendorcredit" },
        ] || [],
    },

    {
      name: "Banking",
      icon: <Bank size={18} />,
      children:
        [
          { name: "Overview", path: "/banking" },
          { name: "Add Bank", path: "/addbank" },
        ] || [],
    },

    /* ============================================================
     *  COMMERCIAL SECTION (Exact Icons From Screenshot)
     * ============================================================ */
    {
      name: "Logistics",
      icon: <Folder size={18} />,
      children:
        [
          {
            name: "Air Inbound",
            path: "/air-inbound",
            icon: <FontAwesomeIcon icon={faPlaneArrival} size="sm" />,
          },
          {
            name: "Air Outbound",
            path: "/air-outbound",
            icon: <FontAwesomeIcon icon={faPlaneDeparture} size="sm" />,
          },
          {
            name: "Ocean Inbound",
            path: "/ocean-inbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
          {
            name: "Ocean Outbound",
            path: "/ocean-outbound",
            icon: <FontAwesomeIcon icon={faShip} size="sm" />,
          },
        ] || [],
    },

    { name: "Reports", icon: <BarChart size={18} />, path: "/reports" },
    { name: "Logistics Report", icon: <BarChart size={18} />, path: "/reports/clearance-pending" },
    { name: "Documents", icon: <Folder size={18} />, path: "/documents" },
    {
      name: "User Management",
      icon: <Puzzle size={18} />,
      path: "/user-management"
    },

    { name: "Ask Assistant", icon: <ChatDots size={18} />, path: "/ask-assistant" },
  ] || [];

/* ============================================================
 *  MAIN COMPONENT
 * ============================================================ */
export default function Sidebar({ isCompact = false }) {
  const [open, setOpen] = useState(new Set());
  const [activeSub, setActiveSub] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /* Highlight active route */
  useEffect(() => {
    const allSubMenus =
      NAV?.flatMap?.((i) => i?.children || []) || [];

    const foundSub =
      allSubMenus?.find?.((ch) => ch?.path === location?.pathname);

    if (foundSub?.name) {
      setActiveSub(foundSub?.name);
      return;
    }

    const foundTop =
      (NAV || [])?.find?.((i) => i?.path === location?.pathname);

    if (foundTop?.name) setActiveSub(foundTop?.name);
  }, [location?.pathname]);

  const toggle = (name) => {
    setOpen((prev) => {
      const s = new Set(prev);
      s?.has?.(name) ? s?.delete?.(name) : s?.add?.(name);
      return s;
    });
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="btn btn-light d-lg-none position-fixed top-0 start-0 m-2 z-3"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X size={22} /> : <List size={22} />}
      </button>

      <div
        className={`sidebar_block bg-light border-end d-flex flex-column 
          ${isCompact ? "align-items-center" : ""} 
          ${mobileOpen ? "active" : ""}`}
      >
        <ul className="nav flex-column w-100 mb-auto mt-2">
          {(NAV || [])?.map?.((item, idx) => {
            const hasChildren = !!(item?.children?.length > 0);
            const isOpen = open?.has?.(item?.name);
            const isActiveTop = activeSub === item?.name;

            return (
              <li key={idx} className="nav-item">
                <button
                  className={`nav-link w-100 d-flex align-items-center 
                    ${isCompact ? "justify-content-center" : "gap-2 px-3"}
                    py-2 border-0 rounded-0 
                    ${isActiveTop ? "bg-primary text-white" : "text-dark"}`}
                  onClick={() => {
                    if (isCompact) {
                      if (item?.path) {
                        navigate(item?.path);
                      } else if (hasChildren) {
                        navigate(item?.children?.[0]?.path || "/");
                      }
                      setMobileOpen(false);
                    } else if (hasChildren) {
                      toggle(item?.name);
                    } else if (item?.path) {
                      navigate(item?.path);
                      setMobileOpen(false);
                    }
                  }}
                >
                  {!isCompact && (
                    <span
                      className={`${hasChildren ? "" : "invisible"} ${isOpen ? "rotate-90" : ""
                        }`}
                      style={{ transition: "transform .2s" }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}

                  {item?.icon || null}

                  {!isCompact && <span>{item?.name || ""}</span>}
                </button>

                {/* Submenu */}
                {!isCompact && hasChildren && (
                  <div className={`collapse ${isOpen ? "show" : ""}`}>
                    <ul className="list-unstyled ms-4 my-1">
                      {(item?.children || [])?.map?.((ch, i) => {
                        const active = activeSub === ch?.name;

                        return (
                          <li key={i} className="mb-1">
                            <div
                              className={`d-flex align-items-center gap-2 rounded-2 py-1 px-2 
                                ${active ? "bg-primary text-white" : "text-dark"}`}
                              role="button"
                              onClick={() => {
                                setActiveSub(ch?.name);
                                navigate(ch?.path || "/");
                                setMobileOpen(false);
                              }}
                            >
                              {ch?.icon || null}
                              <span>{ch?.name}</span>

                              {ch?.plusPath && (
                                <button
                                  className={`btn btn-sm p-0 ms-auto border-0 bg-transparent ${active ? "text-white" : "text-secondary"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(ch?.plusPath);
                                    setMobileOpen(false);
                                  }}
                                >
                                  <Plus size={18} />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div
          className={`mt-auto w-100 border-top py-3 ${isCompact ? "text-center" : "px-3"
            }`}
        >
          {/* <button
            className={`btn btn-light d-flex ${isCompact
              ? "justify-content-center w-100"
              : "align-items-center gap-2 w-100"
              } border-0 text-secondary mb-2`}
            onClick={() => navigate("/payments")}
          >
            <Puzzle size={18} />
            {!isCompact && <span>Lom Payments</span>}
          </button> */}

          <button
            className={`btn btn-light d-flex ${isCompact
              ? "justify-content-center w-100"
              : "align-items-center gap-2 w-100"
              } border-0 text-secondary`}
            onClick={() => {
              sessionStorage.clear();
              localStorage.removeItem("auth");
              navigate("/");
              window.location.reload();
            }}
          >
            <BoxArrowRight size={18} />
            {!isCompact && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
