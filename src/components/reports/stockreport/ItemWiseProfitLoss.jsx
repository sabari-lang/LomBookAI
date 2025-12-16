import React, { useState } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ItemWiseProfitLoss = () => {
    const [fromDate, setFromDate] = useState("2025-11-01");
    const [toDate, setToDate] = useState("2025-11-05");
    const [itemsHavingSale, setItemsHavingSale] = useState(false);

    // ✅ Example Data — replace with API response
    const data = [
        {
            id: 1,
            itemName: "Hp-laptop",
            sale: 0,
            saleReturn: 0,
            purchase: 17700,
            purchaseReturn: 0,
            openingStock: 0,
            closingStock: 0,
            taxReceivable: 2700,
            taxPayable: 0,
            profitLoss: -15000,
        },
        {
            id: 2,
            itemName: "Sample Item",
            sale: 0,
            saleReturn: 0,
            purchase: 0,
            purchaseReturn: 0,
            openingStock: 0,
            closingStock: 0,
            taxReceivable: 0,
            taxPayable: 0,
            profitLoss: 0,
        },
    ];

    // ✅ Filter "Items Having Sale"
    const filteredData = itemsHavingSale
        ? data.filter((i) => i.sale > 0)
        : data;

    // ✅ Total Profit/Loss
    const totalProfitLoss = filteredData.reduce(
        (a, b) => a + b.profitLoss,
        0
    );

    // ✅ Table Columns
    const columns = [
        {
            name: "Item Name",
            selector: (row) => row.itemName,
            grow: 2,
            style: { fontWeight: 500 },
        },
        { name: "Sale", selector: (row) => row.sale, center: true },
        { name: "Cr. Note / Sale Return", selector: (row) => row.saleReturn, center: true },
        { name: "Purchase", selector: (row) => row.purchase, center: true },
        { name: "Dr. Note / Purchase Return", selector: (row) => row.purchaseReturn, center: true },
        { name: "Opening Stock", selector: (row) => row.openingStock, center: true },
        { name: "Closing Stock", selector: (row) => row.closingStock, center: true },
        { name: "Tax Receivable", selector: (row) => row.taxReceivable, center: true },
        { name: "Tax Payable", selector: (row) => row.taxPayable, center: true },

        // ✅ Profit/Loss with color formatting
        {
            name: "Net Profit/Loss",
            selector: (row) =>
                row.profitLoss < 0
                    ? `- ₹ ${Math.abs(row.profitLoss).toLocaleString()}`
                    : `₹ ${row.profitLoss.toLocaleString()}`,
            right: true,
            style: (row) => ({
                color: row.profitLoss < 0 ? "red" : "green",
                fontWeight: 600,
            }),
        },
    ];

    // ✅ Excel Download
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ProfitLoss");

        XLSX.writeFile(workbook, "Item_Wise_Profit_Loss.xlsx");
    };

    // ✅ Print / PDF
    const generatePDF = async () => {
        const tableArea = document.getElementById("profitTableArea");

        const canvas = await html2canvas(tableArea, { scale: 2 });
        const pdf = new jsPDF("p", "mm", "a4");

        const imgData = canvas.toDataURL("image/png");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("Item_Wise_Profit_Loss.pdf");
    };

    return (
        <div
            className="container-fluid py-3"
            style={{ height: "calc(100vh - 10vh)", overflowY: "auto" }}
        >
            {/* ✅ Top Filter Bar */}
            <div className="d-flex justify-content-between align-items-center bg-white rounded border shadow-sm p-2 mb-3">

                {/* ✅ From - To */}
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex flex-column">
                        <small className="fw-semibold text-muted">From</small>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "145px" }}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>

                    <div className="d-flex flex-column">
                        <small className="fw-semibold text-muted">To</small>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            style={{ width: "145px" }}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>

                    {/* ✅ Items Having Sale */}
                    <div className="form-check ms-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="saleCheck"
                            checked={itemsHavingSale}
                            onChange={() => setItemsHavingSale(!itemsHavingSale)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="saleCheck">
                            Items Having Sale
                        </label>
                    </div>
                </div>

                {/* ✅ Right Side Action Buttons */}
                <div className="d-flex gap-3">
                    <button
                        className="btn btn-outline-success rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "42px", height: "42px" }}
                        onClick={downloadExcel}
                    >
                        <i className="bi bi-file-earmark-excel"></i>
                    </button>

                    <button
                        className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "42px", height: "42px" }}
                        onClick={generatePDF}
                    >
                        <i className="bi bi-printer"></i>
                    </button>
                </div>
            </div>



            {/* ✅ Table Area */}
            <div id="profitTableArea" className="bg-white p-2 border rounded shadow-sm"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={filteredData}
                    highlightOnHover
                    pagination={false}
                />
            </div>

            {/* ✅ Total Profit/Loss */}
            <div className="text-end fw-bold mt-3 pe-3">
                <span>Total Amount:&nbsp;</span>
                <span
                    style={{ color: totalProfitLoss < 0 ? "red" : "green" }}
                >
                    {totalProfitLoss < 0
                        ? `- ₹ ${Math.abs(totalProfitLoss).toLocaleString()}`
                        : `₹ ${totalProfitLoss.toLocaleString()}`}
                </span>
            </div>
        </div>
    );
};

export default ItemWiseProfitLoss;
