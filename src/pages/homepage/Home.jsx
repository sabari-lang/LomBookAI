import React, { useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import IncomeExpense from "../../components/home/IncomeExpense";
import CashFlow from "../../components/home/CashFlow";

const Home = () => {
  const navigate = useNavigate();

  // For controlling dropdowns
  const [showReceivableMenu, setShowReceivableMenu] = useState(false);
  const [showPayableMenu, setShowPayableMenu] = useState(false);

  // Mock data
  const data = useMemo(
    () => [
      { month: "Apr 2025", income: 3200, expense: 2500, cash: 700 },
      { month: "May 2025", income: 4000, expense: 3100, cash: 1600 },
      { month: "Jun 2025", income: 3700, expense: 2900, cash: 2400 },
      { month: "Jul 2025", income: 4200, expense: 3500, cash: 3100 },
      { month: "Aug 2025", income: 3800, expense: 3000, cash: 3900 },
      { month: "Sep 2025", income: 4500, expense: 3700, cash: 4700 },
      { month: "Oct 2025", income: 4600, expense: 3900, cash: 5400 },
      { month: "Nov 2025", income: 4900, expense: 4100, cash: 6200 },
      { month: "Dec 2025", income: 5100, expense: 4400, cash: 6900 },
      { month: "Jan 2026", income: 4800, expense: 4200, cash: 7500 },
      { month: "Feb 2026", income: 5000, expense: 4400, cash: 8100 },
      { month: "Mar 2026", income: 5200, expense: 4300, cash: 9000 },
    ],
    []
  );

  const totalIncome = data.reduce((sum, i) => sum + i.income, 0);
  const totalExpense = data.reduce((sum, i) => sum + i.expense, 0);

  return (
    <div
      className="container-fluid bg-light py-4 overflow-auto rounded-3"
      style={{ height: "calc(100vh - 11vh)" }}
    >
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start flex-wrap mb-3">
        <div>
          <h6 className="fw-semibold mb-1">
            Hello, <span className="text-capitalize">ai</span>
          </h6>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            LOM TECHNOLOGIES INDIA PRIVATE LIMITED
          </p>
        </div>
        <div className="text-end small text-muted">
          Lom Books India Helpline: <strong>18005726671</strong>
          <br />
          Mon - Fri: 9 AM - 7 PM | Toll Free
        </div>
      </div>

      {/* NAV */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button className="nav-link active">Dashboard</button>
        </li>
        <li className="nav-item">
          <button className="nav-link">Getting Started</button>
        </li>
        <li className="nav-item">
          <button className="nav-link">Recent Updates</button>
        </li>
        {/* <li className="ms-auto">
          <button className="btn btn-sm btn-outline-primary">
            + New Dashboard
          </button>
        </li> */}
      </ul>

      {/* PROMO */}
      <div
        className="alert d-flex align-items-center justify-content-between mt-3 rounded"
        style={{
          backgroundColor: "#fff9f3",
          border: "1px solid #f4d4a3",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <h6 className="fw-semibold mb-1">Introducing Lom Payments!</h6>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            Manage payments securely and seamlessly.{" "}
            <a href="#" className="text-decoration-none">
              Learn More
            </a>
          </p>
        </div>
        <div className="text-end">
          <p className="text-success mb-1 fw-semibold">2% per transaction</p>
          <button className="btn btn-primary btn-sm">Set Up Now</button>
        </div>
      </div>

      {/* RECEIVABLES + PAYABLES */}
      <div className="row g-3">
        {/* ---------- Total Receivables ---------- */}
        <div className="col-md-6 position-relative">
          <div className="card border rounded shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h6>Total Receivables</h6>
              <div className="position-relative">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setShowReceivableMenu(!showReceivableMenu);
                    setShowPayableMenu(false);
                  }}
                >
                  + New
                </button>

                {showReceivableMenu && (
                  <div
                    className="dropdown-menu show p-0 shadow"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      zIndex: 1000,
                      width: "220px",
                    }}
                  >
                    <button
                      className="dropdown-item fw-semibold bg-primary text-white"
                      onClick={() => navigate("/newinvoice")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Invoice
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/newcurring")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Recurring
                      Invoice
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/recordpayment")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Customer
                      Payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted small mt-2 mb-1">
              Total Unpaid Invoices ₹0.00
            </p>
            <div className="progress mb-3" style={{ height: "4px" }}>
              <div className="progress-bar" style={{ width: "0%" }}></div>
            </div>
            <div className="d-flex justify-content-between">
              <div>
                <p className="small text-primary fw-semibold mb-0">CURRENT</p>
                <h6 className="fw-bold">₹0.00</h6>
              </div>
              <div>
                <p className="small text-danger fw-semibold mb-0">OVERDUE</p>
                <h6 className="fw-bold text-danger">₹0.00</h6>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Total Payables ---------- */}
        <div className="col-md-6 position-relative">
          <div className="card border rounded shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h6>Total Payables</h6>
              <div className="position-relative">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setShowPayableMenu(!showPayableMenu);
                    setShowReceivableMenu(false);
                  }}
                >
                  + New
                </button>

                {showPayableMenu && (
                  <div
                    className="dropdown-menu show p-0 shadow"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      zIndex: 1000,
                      width: "220px",
                    }}
                  >
                    <button
                      className="dropdown-item fw-semibold bg-primary text-white"
                      onClick={() => navigate("/newbill")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Bill
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/newpaymentmade")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Vendor
                      Payment
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => navigate("/newrecurringbill")}
                    >
                      <i className="bi bi-plus-circle me-2"></i> New Recurring
                      Bill
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-muted small mt-2 mb-1">
              Total Unpaid Bills ₹0.00
            </p>
            <div className="progress mb-3" style={{ height: "4px" }}>
              <div className="progress-bar" style={{ width: "0%" }}></div>
            </div>
            <div className="d-flex justify-content-between">
              <div>
                <p className="small text-primary fw-semibold mb-0">CURRENT</p>
                <h6 className="fw-bold">₹0.00</h6>
              </div>
              <div>
                <p className="small text-danger fw-semibold mb-0">OVERDUE</p>
                <h6 className="fw-bold text-danger">₹0.00</h6>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Cash Flow */}
      <CashFlow
        data={data}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />


      {/* Income / Expense */}
      <IncomeExpense
        data={data}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />



      {/* Projects / Bank Section */}
      <div className="row mt-4 g-3">
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">Projects</div>
            <div className="card-body text-center text-primary small">
              Add Project(s) to this watchlist
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-light fw-semibold">
              Bank and Credit Cards
            </div>
            <div className="card-body text-center text-muted small">
              Yet to add Bank and Credit Card details <br />
              <span className="text-primary">Add Bank Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Watchlist */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-header bg-light d-flex justify-content-between">
          <span className="fw-semibold">Account Watchlist</span>
          <span className="text-primary small">Cash ▾</span>
        </div>
        <div className="card-body text-center text-muted py-4">
          No accounts added to watchlist
        </div>
      </div>
    </div>
  );
};

export default Home;
