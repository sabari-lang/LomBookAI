


import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import Sidebar from "../sidebar/Sidebar";
import Footer from "../footer/Footer";

const Layout = () => {

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [navigate]);



  const isCompact = location.pathname.startsWith("/reports");
  const hideSidebar = location.pathname.startsWith("/import-parties"); // 👈 Hide sidebar on ImportParties

  return (
    <div className="container-fluid p-0" style={{ height: "100vh", overflow: "hidden" }}>
      {/* ===== TOP NAVBAR ===== */}
      <Navbar />

      {/* ===== SIDEBAR + MAIN CONTENT ===== */}
      <div className="row g-0">
        {/* Conditionally render Sidebar */}
        {!hideSidebar && (
          <aside className={`col-auto ${isCompact ? "sidebar-compact" : "sidebar-wide"}`}>
            <Sidebar isCompact={isCompact} />
          </aside>
        )}

        {/* Main content adjusts when sidebar hidden */}
        <main
          className={`${hideSidebar ? "col-12" : "col"} m-0`}
          style={{
            height: "calc(100vh - 12vh)",
            overflow: "auto",
            scrollbarWidth: "thin",
            backgroundColor: "#f9fafc",
            transition: "all 0.3s ease",
          }}
        >
          <Outlet />
        </main>

      </div>
      <Footer />
    </div>
  );
};

export default Layout;



