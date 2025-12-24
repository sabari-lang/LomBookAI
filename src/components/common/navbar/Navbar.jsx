import { clearAuth } from "../../../utils/auth";

import React, { useState, useRef, useEffect } from "react";
import ShortcutMenu from "../shortcut/ShortcutMenu";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppBack } from "../../../hooks/useAppBack";

// Inline styles for production navbar
const styles = {
  nav: {
    // background: "#0d1117",
    background: "rgb(1 13 30)",
    height: "48px",
    position: "sticky",
    top: 0,
    zIndex: 999,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1 1 0",
  },
  centerGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "1 1 0",
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
    flex: "1 1 0",
  },
  ghostBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.85)",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    transition: "background 0.15s, color 0.15s",
  },
  ghostBtnHover: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
  },
  ghostBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  logo: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    userSelect: "none",
  },
  hintText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "12px",
    userSelect: "none",
  },
  profileBtn: {
    background: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "4px",
    minWidth: "160px",
    background: "#fff",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1050,
    overflow: "hidden",
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    color: "#333",
  },
  dropdownItemHover: {
    background: "#f5f5f5",
  },
  dropdownDanger: {
    color: "#dc3545",
  },
  iconSize: {
    fontSize: "18px",
  },
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack, isAtRoot } = useAppBack();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  // ESC handler is now centralized in Layout.jsx - removed from here

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [profileOpen]);

  const getBtnStyle = (id, disabled = false) => ({
    ...styles.ghostBtn,
    ...(hoveredBtn === id && !disabled ? styles.ghostBtnHover : {}),
    ...(disabled ? styles.ghostBtnDisabled : {}),
  });

  return (
    <>
      <nav style={styles.nav}>
        {/* LEFT GROUP */}
        <div style={styles.leftGroup}>
          {/* Back Button - hidden on root */}
          {!isAtRoot && (
            <button
              type="button"
              style={getBtnStyle("back")}
              onClick={() => goBack()}
              onMouseEnter={() => setHoveredBtn("back")}
              onMouseLeave={() => setHoveredBtn(null)}
              aria-label="Go back"
              title="Go back (Esc)"
            >
              <i className="bi bi-arrow-left" style={styles.iconSize}></i>
              <span>Back</span>
            </button>
          )}

          {/* Logo */}
          <span
            style={styles.logo}
            onClick={() => navigate("/")}
            title="Go to Home"
          >
            iLOMO
          </span>

          {/* Refresh */}
          <button
            type="button"
            style={getBtnStyle("refresh")}
            onMouseEnter={() => setHoveredBtn("refresh")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => window.location.reload()}
            aria-label="Refresh page"
            title="Refresh Page"
          >
            <i className="bi bi-arrow-clockwise" style={styles.iconSize}></i>
          </button>
        </div>

        {/* CENTER GROUP */}
        <div style={styles.centerGroup}>
          {!isAtRoot && (
            <span style={styles.hintText}>Press Esc to go back</span>
          )}
        </div>

        {/* RIGHT GROUP */}
        <div style={styles.rightGroup}>
          {/* Shortcut */}
          <button
            type="button"
            style={getBtnStyle("shortcut")}
            onMouseEnter={() => setHoveredBtn("shortcut")}
            onMouseLeave={() => setHoveredBtn(null)}
            data-bs-toggle="offcanvas"
            data-bs-target="#shortcutPanel"
            title="Keyboard Shortcuts"
          >
            <i className="bi bi-lightning-charge-fill" style={styles.iconSize}></i>
            <span className="d-none d-md-inline">Shortcuts</span>
          </button>

          {/* Help */}
          <button
            type="button"
            style={getBtnStyle("help")}
            onMouseEnter={() => setHoveredBtn("help")}
            onMouseLeave={() => setHoveredBtn(null)}
            title="Help & Support"
          >
            <i className="bi bi-question-circle" style={styles.iconSize}></i>
            <span className="d-none d-md-inline">Help</span>
          </button>

          {/* Profile */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              type="button"
              style={styles.profileBtn}
              onClick={() => setProfileOpen((v) => !v)}
              title="Profile Menu"
            >
              <i className="bi bi-person-fill text-primary" style={{ fontSize: "18px" }}></i>
            </button>

            {profileOpen && (
              <div style={styles.dropdown}>
                <button
                  style={styles.dropdownItem}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "transparent")}
                >
                  My Profile
                </button>
                <button
                  style={styles.dropdownItem}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "transparent")}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </button>
                <hr style={{ margin: 0, borderColor: "#eee" }} />
                <button
                  style={{ ...styles.dropdownItem, ...styles.dropdownDanger }}
                  onMouseEnter={(e) => (e.target.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.target.style.background = "transparent")}
                  onClick={() => {
                    clearAuth();
                    navigate("/");
                    window.location.reload();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Shortcut Offcanvas */}
      <div className="offcanvas offcanvas-end" id="shortcutPanel" style={{ width: "380px" }}>
        <div className="offcanvas-header border-bottom">
          <h5 className="fw-bold">Keyboard Shortcuts</h5>
          <button className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          <ShortcutMenu />
        </div>
      </div>
    </>
  );
};

export default Navbar;
