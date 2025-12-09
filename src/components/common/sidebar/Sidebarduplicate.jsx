import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronRight,
  HouseDoor,
  Box,
  Boxes,
  Cart,
  Bag,
  Clock,
  Bank,
  Person,
  BarChart,
  Folder,
  Puzzle,
  Plus,
  List,
  X,
  Wrench,
  GraphUp,
  ClipboardCheck,
  ChatDots
} from "react-bootstrap-icons";
import "../../../styles/Sidebar.css"; // optional, ensures isolation

/** ✅ NAV Structure (with all sections + Ask Assistant) */
const NAV = [
  { name: "Home", icon: <HouseDoor size={18} />, path: "/" },

  {
    name: "Items",
    icon: <Box size={18} />,
    children: [
      { name: "Items", path: "/items", plusPath: "/newitem" },
      // { name: "Composite Items", path: "/compositeitems", plusPath: "/newcompositeitem" },
      // { name: "Item Groups", path: "/itemgroups", plusPath: "/newitemgroup" },
      // { name: "Price Lists", path: "/pricelists", plusPath: "/newpricelist" },
    ],
  },

  // {
  //   name: "Inventory",
  //   icon: <Boxes size={18} />,
  //   children: [
  //     { name: "Inventory Adjustments", path: "/inventoryadjustments", plusPath: "/newinventoryadjustment" },
  //     { name: "Packages", path: "/packages", plusPath: "/newpackage" },
  //     { name: "Shipments", path: "/shipments", plusPath: "/newshipment" },
  //   ],
  // },

  {
    name: "Sales",
    icon: <Cart size={18} />,
    children: [
      { name: "Customers", path: "/viewcustomer", plusPath: "/newcustomer" },
      { name: "Quotes", path: "/quotes", plusPath: "/newquotes" },
      { name: "Sales Orders", path: "/salesorders", plusPath: "/newsalesorder" },
      { name: "Invoices", path: "/invoices", plusPath: "/newinvoice" },
      { name: "Recurring Invoices", path: "/recurring", plusPath: "/newrecurring" },
      { name: "Delivery Challans", path: "/deliverychallans", plusPath: "/newdeliverychallan" },
      { name: "Payments Received", path: "/payments", plusPath: "/recordpayment" },
      { name: "Credit Notes", path: "/creditnotes", plusPath: "/newcreditnotes" },
    ],
  },

  {
    name: "Purchases",
    icon: <Bag size={18} />,
    children: [
      { name: "Vendors", path: "/vendors", plusPath: "/newvendor" },
      { name: "Expenses", path: "/expenses", plusPath: "/newexpense" },
      { name: "Recurring Expenses", path: "/recurringexpenses", plusPath: "/newrecurringexpense" },
      { name: "Purchase Orders", path: "/purchaseorders", plusPath: "/newpurchaseorder" },
      { name: "Purchase Receives", path: "/purchasereceives", plusPath: "/newpurchasereceive" },
      { name: "Bills", path: "/bills", plusPath: "/newbill" },
      { name: "Recurring Bills", path: "/recurringbills", plusPath: "/newrecurringbill" },
      { name: "Payments Made", path: "/paymentsmade", plusPath: "/newpaymentmade" },
      { name: "Vendor Credits", path: "/vendorcredits", plusPath: "/newvendorcredit" },
    ],
  },

  // {
  //   name: "Audit",
  //   icon: <ClipboardCheck size={18} />,
  //   children: [
  //     { name: "Bank Reconciliation", path: "/bank-reconciliation" },
  //     { name: "Audit Trail", path: "/audit-trail" },
  //     { name: "Verification Report", path: "/verification-report" },
  //   ],
  // },

  // {
  //   name: "Accountant",
  //   icon: <Person size={18} />,
  //   children: [
  //     { name: "Manual Journals", path: "/manual-journals", plusPath: "/new-manual-journal" },
  //     { name: "Bulk Update", path: "/bulk-update", plusPath: "/new-bulk-update" },
  //     { name: "Currency Adjustments", path: "/currency-adjustments", plusPath: "/new-currency-adjustment" },
  //     { name: "Chart of Accounts", path: "/chart-of-accounts", plusPath: "/new-chart-account" },
  //     { name: "Budgets", path: "/budgets", plusPath: "/new-budget" },
  //     { name: "Transaction Locking", path: "/transaction-locking", plusPath: "/new-transaction-lock" },
  //   ],
  // },

  { name: "Reports", icon: <BarChart size={18} />, path: "/reports" },

  // {
  //   name: "Utilities",
  //   icon: <Wrench size={18} />,
  //   children: [
  //     { name: "Import Items", path: "/import-items" },
  //     { name: "Import From Tally", path: "/import-tally" },
  //     { name: "Import Parties", path: "/import-parties" },
  //     { name: "Exports To Tally", path: "/export-tally" },
  //     { name: "Export Items", path: "/export-items" },
  //   ],
  // },

  { name: "Documents", icon: <Folder size={18} />, path: "/documents" },

  // ✅ Added new Ask Assistant section
  { name: "Ask Assistant", icon: <ChatDots size={18} />, path: "/ask-assistant" },
];

export default function Sidebar({ isCompact = false }) {
  const [open, setOpen] = useState(new Set());
  const [activeSub, setActiveSub] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Set active tab based on route
  useEffect(() => {
    const allSubMenus = NAV?.flatMap?.((item) => item?.children || []) || [];
    const foundSub = allSubMenus?.find?.((ch) => ch?.path === location?.pathname);
    if (foundSub?.name) {
      setActiveSub(foundSub.name);
      return;
    }
    const foundTop = NAV?.find?.((item) => item?.path === location?.pathname);
    if (foundTop?.name) setActiveSub(foundTop.name);
  }, [location?.pathname]);

  const toggle = (name = "") => {
    setOpen((prev) => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });
  };

  return (
    <>
      {/* ✅ Mobile toggle */}
      <button
        className="btn btn-light d-lg-none position-fixed top-0 start-0 m-2 z-3"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={22} /> : <List size={22} />}
      </button>

      <div
        className={`sidebar_block bg-light border-end d-flex flex-column ${isCompact ? "align-items-center" : ""
          } ${mobileOpen ? "active" : ""}`}
      >
        {/* ✅ Navigation */}
        <ul className="nav flex-column w-100 mb-auto mt-2">
          {(NAV || []).map((item, idx) => {
            const hasChildren = !!item?.children?.length;
            const isOpen = open?.has?.(item?.name);
            const isActiveTop = activeSub === item?.name;

            return (
              <li key={item?.name || idx} className="nav-item">
                <button
                  className={`nav-link w-100 d-flex align-items-center ${isCompact ? "justify-content-center" : "gap-2 px-3"
                    } py-2 border-0 rounded-0 ${isActiveTop ? "bg-primary text-white" : "text-dark"
                    }`}
                  title={item?.name}
                  onClick={() => {
                    if (isCompact) {
                      if (item?.path) navigate(item?.path);
                      else if (hasChildren && item?.children?.[0]?.path)
                        navigate(item?.children?.[0]?.path);
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
                      className={`${hasChildren ? "" : "invisible"
                        } ${isOpen ? "rotate-90" : ""}`}
                      style={{ transition: "transform .2s" }}
                    >
                      <ChevronRight size={14} />
                    </span>
                  )}
                  {item?.icon}
                  {!isCompact && <span>{item?.name}</span>}
                </button>

                {/* ✅ Submenu */}
                {!isCompact && hasChildren && (
                  <div className={`collapse ${isOpen ? "show" : ""}`}>
                    <ul className="list-unstyled ms-4 my-1">
                      {(item?.children || []).map((ch, i) => {
                        const active = activeSub === ch?.name;
                        return (
                          <li key={ch?.name || i} className="mb-1">
                            <div
                              className={`d-flex align-items-center justify-content-between rounded-2 py-1 px-2 ${active ? "bg-primary text-white" : "text-dark"
                                }`}
                              role="button"
                              onClick={() => {
                                setActiveSub(ch?.name);
                                if (ch?.path) {
                                  navigate(ch?.path);
                                  setMobileOpen(false);
                                }
                              }}
                            >
                              <span>{ch?.name}</span>
                              {ch?.plusPath && (
                                <button
                                  className={`btn btn-sm p-0 border-0 bg-transparent ${active ? "text-white" : "text-secondary"
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(ch?.plusPath);
                                    setMobileOpen(false);
                                  }}
                                  title={`New ${ch?.name}`}
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

        {/* ✅ Footer */}
        <div
          className={`mt-auto w-100 border-top py-3 ${isCompact ? "text-center" : "px-3"
            }`}
        >
          <button
            className={`btn btn-light d-flex ${isCompact
              ? "justify-content-center w-100"
              : "align-items-center gap-2 w-100"
              } border-0 text-secondary`}
            onClick={() => navigate("/payments")}
            title="Lom Payments"
          >
            <Puzzle size={18} />
            {!isCompact && <span>Lom Payments</span>}
          </button>
        </div>
      </div>
    </>
  );
}
