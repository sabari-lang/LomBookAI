import React from "react";
import { Link } from "react-router-dom";

const PurchaseReceives = () => {
  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0" style={{ minHeight: "60vh" }}>
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.10)",
        }}
      >
        <div>
          <h5 className="fw-semibold m-0"><i className="bi bi-box-seam me-2"></i>Purchase Receives</h5>
          <p className="text-muted small mb-0">Track all purchase receives and mark supplies as received.</p>
        </div>
        <Link to="/newpurchasereceive" className="btn btn-sm btn-primary">
          + New Purchase Receive
        </Link>
      </div>
      <div className="alert alert-warning small" role="alert">
        Purchase receive list is under construction. Use the + button to create a new receive entry, and return later for the detailed log.
      </div>
    </div>
  );
};

export default PurchaseReceives;
