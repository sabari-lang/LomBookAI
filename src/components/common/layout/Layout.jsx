


import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import Sidebar from "../sidebar/Sidebar";
import Footer from "../footer/Footer";
import { useAppBack } from "../../../hooks/useAppBack";
import { cleanupBackdrops } from "../../../utils/modalManager";

const Layout = () => {

  const location = useLocation();
  const { goBack, isAtRoot } = useAppBack();

  // Single global ESC handler for back navigation
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;

      // Don't navigate if at root
      if (isAtRoot) return;

      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();

      // Don't navigate when user is typing in input fields
      if (tag === "input" || tag === "textarea" || tag === "select" || activeEl?.isContentEditable) {
        return;
      }

      // Don't navigate if any modal/dialog/drawer is open
      const hasOverlay = document.querySelector(
        ".modal.show, [role='dialog']:not([aria-hidden='true']), [aria-modal='true'], .MuiDialog-root, .MuiDrawer-root, .ant-modal-wrap:not(.ant-modal-wrap-hidden), .ant-drawer-open"
      );
      if (hasOverlay) return;

      // Safe to navigate back with smart fallback (debounce built into goBack)
      goBack();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [goBack, isAtRoot]);

  // On every route change ensure stale backdrops/scroll are cleared
  useEffect(() => {
    cleanupBackdrops();
    return () => cleanupBackdrops();
  }, [location.pathname]);



  const hideSidebar = location.pathname.startsWith("/import-parties"); // 👈 Hide sidebar on ImportParties

  return (
    <div className="container-fluid p-0" style={{ height: "100vh", overflow: "hidden" }}>
      {/* ===== TOP NAVBAR ===== */}
      <Navbar />

      {/* ===== SIDEBAR + MAIN CONTENT ===== */}
      <div className="row g-0">
        {/* Sidebar - handles both desktop and mobile internally */}
        {!hideSidebar && (
          <aside className="col-auto sidebar-wrapper">
            <Sidebar />
          </aside>
        )}

        {/* Main content adjusts when sidebar hidden */}
        <main
          className={`${hideSidebar ? "col-12" : "col"} m-0`}
          style={{
            height: "calc(100vh - 6vh)",
            overflow: "auto",
            scrollbarWidth: "thin",
            // backgroundColor: "#f9fafc",
            // background: "linear-gradient(to bottom, #A9D4E9 0%, #F8FAFC 100%)",
            // background: "linear-gradient(to bottom, #A9D4E9 0%, #F8FAFC 100%)",
            background: "linear-gradient(to bottom, #A9D4E9 0%, #F8FAFC 100%)",

            transition: "all 0.3s ease",
          }}
        >
          <Outlet />
        </main>

      </div>
      {/* ===== FOOTER ===== */}
      
    </div>
  );
};

export default Layout;



