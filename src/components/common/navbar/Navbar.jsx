import { clearAuth } from "../../../utils/auth";

import React, { useState, useRef, useEffect } from "react";
import ShortcutMenu from "../shortcut/ShortcutMenu";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Close profile menu on outside interaction (safe fallback)
  useEffect(() => {
    let handler;
    try {
      handler = (e) => {
        const root = profileRef?.current;
        if (!root) return;
        const target = e?.target;
        if (!profileOpen) return;
        if (target && !root.contains(target)) {
          setProfileOpen(false);
        }
      };

      const doc = typeof document !== 'undefined' ? document : null;
      if (doc) {
        doc.addEventListener('pointerdown', handler, { passive: true });
        doc.addEventListener('keydown', (ev) => {
          if (ev?.key === 'Escape') setProfileOpen(false);
        });
      }

      return () => {
        try {
          if (doc && handler) {
            doc.removeEventListener('pointerdown', handler, { passive: true });
          }
        } catch {}
      };
    } catch {
      // no-op: environment without DOM
      return () => {};
    }
  }, [profileOpen]);
      
  return (
    <>
      <nav
        className="px-3"
        style={{
          background: "#2F353E",
          height: "calc(100vh - 94vh)",
          position: "sticky",
          top: 0,
          zIndex: 999,
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          paddingTop: "0px",
          paddingBottom: "0px",
          display: "flex",
          alignItems: "center"
        }}
      >
        {/* LEFT SECTION */}
        <div className="d-flex align-items-center gap-3">

          {/* Logo */}
          <span
            className="text-white fw-bold fs-5"
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.location.reload();
              navigate("/");
            }}
            title="Go to Home"
          >
            iLOMO
          </span>

          {/* Refresh */}
          <button
            className="btn btn-sm text-white p-0 d-flex align-items-center"
            onClick={handleRefresh}
            title="Refresh Page"
            style={{ lineHeight: 0 }}
          >
            <i className="bi bi-arrow-clockwise fs-4"></i>
          </button>
        </div>

        {/* RIGHT SECTION */}
        <div className="d-flex align-items-center gap-4 ms-auto">
          {/* Esc hint */}
          <span className="text-white-50 small d-none d-md-inline" title="Press Esc to go back">
            Press Esc to go back
          </span>

          {/* Shortcut */}
          <button
            className="btn btn-sm text-white d-flex align-items-center gap-1"
            data-bs-toggle="offcanvas"
            data-bs-target="#shortcutPanel"
            title="Open Shortcut Keys"
            style={{ lineHeight: 0 }}
          >
            <i className="bi bi-lightning-charge-fill fs-5"></i>
            <span className="fw-semibold d-none d-md-inline">Shortcut</span>
          </button>

          {/* Help */}
          <button
            className="btn btn-sm text-white d-flex align-items-center gap-1"
            title="Help & Support"
            style={{ lineHeight: 0 }}
          >
            <i className="bi bi-question-circle fs-5"></i>
            <span className="fw-semibold d-none d-md-inline">Help</span>
          </button>

          {/* Profile */}
          <div ref={profileRef} className="dropdown d-flex align-items-center" style={{ position: "relative" }}>
            <button
              type="button"
              className="btn bg-white rounded-circle p-1 d-flex align-items-center justify-content-center"
              title="Profile Menu"
              style={{
                width: "32px",
                height: "32px",
                padding: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => setProfileOpen((v) => !v)}
            >
              <i className="bi bi-person-fill text-primary fs-4"></i>
            </button>

            <ul
              className={`dropdown-menu dropdown-menu-end ${profileOpen ? 'show' : ''}`}
              style={{
                zIndex: 1050,
                display: profileOpen ? 'block' : 'none',
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                minWidth: '12rem'
              }}
            >
              <li><button className="dropdown-item">My Profile</button></li>
              <li><button className="dropdown-item">Settings</button></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    clearAuth();
                    window.location.reload();
                  }}
                >
                  Logout
                </button>
              </li>
            </ul>
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
