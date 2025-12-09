
import React from "react";
import ShortcutMenu from "../shortcut/ShortcutMenu";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

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
          <div className="dropdown d-flex align-items-center">
            <button
              className="btn bg-white rounded-circle p-1 d-flex align-items-center justify-content-center"
              data-bs-toggle="dropdown"
              title="Profile Menu"
              style={{
                width: "32px",
                height: "32px",
                padding: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <i className="bi bi-person-fill text-primary fs-4"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
              <li><button className="dropdown-item">My Profile</button></li>
              <li><button className="dropdown-item">Settings</button></li>
              <li><hr className="dropdown-divider" /></li>
              <li onClick={() => {
                sessionStorage.clear();
                localStorage.removeItem("auth");
                navigate("/");
                window.location.reload();
              }}><button className="dropdown-item text-danger" >Logout</button></li>
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
