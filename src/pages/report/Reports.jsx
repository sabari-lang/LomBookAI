

import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaBars, FaTimes } from "react-icons/fa";

import ViewInvoice from "../../components/sales/invoice/ViewInvoice";
import Bills from "../../components/purchases/bills/Bills";
import DayBook from "../../components/reports/daybook/DayBook";
import AllTransaction from "../../components/reports/alltransactions/Alltransaction";
import BillwiseProfit from "../../components/reports/billwiseprofit/BillwiseProfit";
import Cashflow from "../../components/reports/cashflow/Cashflow";
import PartyWisePL from "../../components/reports/partyreport/PartyWisePL";
import PartyReportByItem from "../../components/reports/partyreport/PartyReportByItem";
import SalePurchaseByParty from "../../components/reports/partyreport/SalePurchaseByParty";
import SalePurchaseByPartyGroup from "../../components/reports/partyreport/SalePurchaseByPartyGroup";
import AllParties from "../../components/reports/partyreport/AllParties";
import PartyStatement from "../../components/reports/partyreport/PartyStatement";
import GSTROne from "../../components/reports/gstreport/GSTROne";
import GSTTwo from "../../components/reports/gstreport/GSTTwo";
import SalesSummaryByHsn from "../../components/reports/gstreport/SalesSummaryByHsn";
import SACReport from "../../components/reports/gstreport/SACReport";
import StockSummary from "../../components/reports/stockreport/StockSummary";
import ItemReportByParty from "../../components/reports/stockreport/ItemReportByParty";
import ItemWiseProfitLoss from "../../components/reports/stockreport/ItemWiseProfitLoss";
import SaleOrderReport from "../../components/reports/saleorderreport/SaleOrderReport";
import SaleOrderItem from "../../components/reports/saleorderreport/SaleOrderItem"
import GSTReport from "../../components/reports/taxes/GSTReport";
import GSTRateReport from "../../components/reports/taxes/GSTRateReport";
import TCSReceivable from "../../components/reports/taxes/TCSReceivable";
import TDSPayable from "../../components/reports/taxes/TDSPayable";
import TDSReceivable from "../../components/reports/taxes/TDSReceivable";
import BankStatement from "../../components/reports/businessstatus/BankStatement";
import DiscountReport from "../../components/reports/businessstatus/DiscountReport";
import LowStockSummary from "../../components/reports/stockreport/LowStockSummary";
import StockDetails from "../../components/reports/stockreport/StockDetails";
import ItemDetails from "../../components/reports/stockreport/ItemDetails";
import ItemWiseDiscount from "../../components/reports/stockreport/ItemWiseDiscount";
import SalePurchaseReportByItem from "../../components/reports/stockreport/SalePurchaseReportByItem";
import StockSummaryReportByItem from "../../components/reports/stockreport/StockSummaryReportByItem";
import ItemCategoryWiseProfitLoss from "../../components/reports/stockreport/ItemCategoryWiseProfitLoss";


const ProfitLoss = () => <h6>📈 Profit And Loss Report</h6>;
const TrialBalance = () => <h6>🧾 Trial Balance Report</h6>;
const BalanceSheet = () => <h6>📚 Balance Sheet Report</h6>;


const GSTR2 = () => <h6>🧾 GSTR 2</h6>;
const GSTR3B = () => <h6>🧾 GSTR 3B</h6>;
const GSTR9 = () => <h6>🧾 GSTR 9</h6>;

// const StockSummary = () => <h6>📦 Stock Summary</h6>;
// const ItemReportByParty = () => <h6>📦 Item Report By Party</h6>;
// const ItemWiseProfitLoss = () => <h6>📊 Item Wise Profit & Loss</h6>;
// const ItemCategoryWiseProfitLoss = () => <h6>📊 Item Category Wise Profit & Loss</h6>;
// const LowStockSummary = () => <h6>⚠️ Low Stock Summary</h6>;
// const StockDetail = () => <h6>📋 Stock Detail</h6>;
// const ItemDetail = () => <h6>🧾 Item Detail</h6>;
// const SalePurchaseByItemCategory = () => <h6>🧾 Sale/Purchase Report By Item Category</h6>;
// const StockSummaryByItemCategory = () => <h6>📊 Stock Summary Report By Item Category</h6>;
// const ItemWiseDiscount = () => <h6>💰 Item Wise Discount</h6>;
// const BankStatement = () => <h6>🏦 Bank Statement</h6>;
// const DiscountReport = () => <h6>💸 Discount Report</h6>;
// const GSTReport = () => <h6>🧾 GST Report</h6>;
// const GSTRateReport = () => <h6>📊 GST Rate Report</h6>;
const Form27EQ = () => <h6>📋 Form No. 27EQ</h6>;
// const TCSReceivable = () => <h6>💰 TCS Receivable</h6>;
// const TDSPayable = () => <h6>💵 TDS Payable</h6>;
// const TDSReceivable = () => <h6>💰 TDS Receivable</h6>;
const Expense = () => <h6>💸 Expense</h6>;
const ExpenseCategoryReport = () => <h6>📋 Expense Category Report</h6>;
const ExpenseItemReport = () => <h6>📋 Expense Item Report</h6>;
// const SaleOrders = () => <h6>🧾 Sale Orders</h6>;
// const SaleOrderItem = () => <h6>📋 Sale Order Item</h6>;
const LoanStatement = () => <h6>🏦 Loan Statement</h6>;

const Reports = () => {
  const [activeReport, setActiveReport] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Define Report Sections ---
  const reportSections = [
    {
      title: "Transaction report",
      reports: [
        { name: "Sale", component: <ViewInvoice /> },
        { name: "Purchase", component: <Bills /> },
        { name: "Day book", component: <DayBook /> },
        { name: "All Transactions", component: <AllTransaction /> },
        // { name: "Profit And Loss", component: <ProfitLoss /> },
        { name: "Bill Wise Profit", component: <BillwiseProfit /> },
        { name: "Cash flow", component: <Cashflow /> },
        // { name: "Trial Balance Report", component: <TrialBalance /> },
        // { name: "Balance Sheet", component: <BalanceSheet /> },
      ],
    },
    {
      title: "Party report",
      reports: [
        { name: "Party Statement", component: <PartyStatement /> },
        { name: "Party wise Profit & Loss", component: <PartyWisePL /> },
        { name: "All parties", component: <AllParties /> },
        { name: "Party Report By Item", component: <PartyReportByItem /> },
        { name: "Sale Purchase By Party", component: <SalePurchaseByParty /> },
        { name: "Sale Purchase By Party Group", component: <SalePurchaseByPartyGroup /> },
      ],
    },
    {
      title: "GST reports",
      reports: [
        { name: "GSTR 1", component: <GSTROne /> },
        { name: "GSTR 2", component: <GSTTwo /> },
        // { name: "GSTR 3B", component: <GSTR3B /> },
        // { name: "GSTR 9", component: <GSTR9 /> },
        { name: "Sale Summary By HSN", component: <SalesSummaryByHsn /> },
        { name: "SAC Report", component: <SACReport /> },
      ],
    },
    {
      title: "Item/ Stock report",
      reports: [
        { name: "Stock summary", component: <StockSummary /> },
        { name: "Item Report By Party", component: <ItemReportByParty /> },
        { name: "Item Wise Profit And Loss", component: <ItemWiseProfitLoss /> },
        { name: "Item Category Wise Profit And Loss", component: <ItemCategoryWiseProfitLoss /> },
        { name: "Low Stock Summary", component: <LowStockSummary /> },
        { name: "Stock Detail", component: <StockDetails /> },
        { name: "Item Detail", component: <ItemDetails /> },
        { name: "Sale/ Purchase Report By Item Category", component: <SalePurchaseReportByItem /> },
        { name: "Stock Summary Report By Item Category", component: <StockSummaryReportByItem /> },
        { name: "Item Wise Discount", component: <ItemWiseDiscount /> },
      ],
    },
    {
      title: "Business Status",
      reports: [
        { name: "Bank Statement", component: <BankStatement /> },
        { name: "Discount Report", component: <DiscountReport /> },
      ],
    },
    {
      title: "Taxes",
      reports: [
        { name: "GST Report", component: <GSTReport /> },
        { name: "GST Rate Report", component: <GSTRateReport /> },
        // { name: "Form No. 27EQ", component: <Form27EQ /> },
        { name: "TCS Receivable", component: <TCSReceivable /> },
        { name: "TDS Payable", component: <TDSPayable /> },
        { name: "TDS Receivable", component: <TDSReceivable /> },
      ],
    },
    // {
    //   title: "Expense report",
    //   reports: [
    //     { name: "Expense", component: <Expense /> },
    //     { name: "Expense Category Report", component: <ExpenseCategoryReport /> },
    //     { name: "Expense Item Report", component: <ExpenseItemReport /> },
    //   ],
    // },
    {
      title: "Sale Order report",
      reports: [
        { name: "Sale Orders", component: <SaleOrderReport /> },
        { name: "Sale Order Item", component: <SaleOrderItem /> },
      ],
    },
    // {
    //   title: "Loan Accounts",
    //   reports: [{ name: "Loan Statement", component: <LoanStatement /> }],
    // },
  ];

  // --- Assign unique shortcuts (Alt + A ... Alt + Z, 0–9 if more) ---
  const allReports = reportSections.flatMap((s) => s.reports);
  const shortcutKeys = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  ].slice(0, allReports.length);
  const reportShortcuts = {};
  allReports.forEach((r, i) => (reportShortcuts[shortcutKeys[i]] = r.name));

  // --- Keyboard Shortcut Handler ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
        const key = e.key.toUpperCase();
        const reportName = reportShortcuts[key];
        if (reportName) {
          setActiveReport(reportName);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedReport = allReports?.find((r) => r.name === activeReport);

  return (
    <div className="d-flex flex-column flex-md-row" style={{ minHeight: "89vh" }}>
      {/* Top Bar for Mobile */}
      <div className="d-md-none d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-white">
        <h6 className="m-0">Reports</h6>
        <button
          className="btn btn-light p-1"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`position-md-static bg-white border-end ${isSidebarOpen ? "position-fixed top-0 start-0 h-100" : "d-none d-md-block"
          }`}
        style={{
          width: "280px",
          zIndex: 1050,
          overflowY: "auto",
          transition: "transform 0.3s ease-in-out",
          height: "89vh",
        }}
      >
        {reportSections?.map((section, i) => (
          <div key={i}>
            <div
              className="px-3 py-2"
              style={{
                background: "#f2f6f8",
                fontWeight: "600",
                fontSize: "13px",
                color: "#444",
                borderBottom: "1px solid #eaeaea",
              }}
            >
              {section?.title}
            </div>
            <ul className="list-unstyled mb-0">
              {section?.reports?.map((r, idx) => {
                const key = Object.keys(reportShortcuts).find(
                  (k) => reportShortcuts[k] === r.name
                );
                return (
                  <li
                    key={idx}
                    onClick={() => {
                      setActiveReport(r.name);
                      setIsSidebarOpen(false);
                    }}
                    className={`px-3 py-2 d-flex justify-content-between ${activeReport === r.name ? "fw-bold text-primary" : ""
                      }`}
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      color: activeReport === r.name ? "#0d6efd" : "#333",
                      background:
                        activeReport === r.name
                          ? "rgba(13,110,253,0.05)"
                          : "transparent",
                      transition: "0.2s",
                    }}
                  >
                    <span>{r.name}</span>
                    <span className="text-muted small">Alt+{key}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-grow-1 bg-light p-2 p-md-3 overflow-auto">
        {selectedReport ? (
          selectedReport.component
        ) : (
          <div className="text-center text-muted mt-5">
            <h6>Select a report to view details</h6>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
