import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PdfPreviewModal from "../../common/popup/PdfPreviewModal";

const ItemDetails = () => {
  const { control, watch } = useForm({
    defaultValues: {
      fromDate: "2025-11-01",
      toDate: "2025-11-26",
      itemName: "",
      hideInactive: false,
    },
  });

  const hideInactive = watch("hideInactive");

  // Mock data
  const allData = [
    {
      id: 1,
      date: "2025-11-05",
      saleQty: 2,
      purchaseQty: 0,
      adjustmentQty: 0,
      closingQty: 98,
    },
    {
      id: 2,
      date: "2025-11-10",
      saleQty: 0,
      purchaseQty: 10,
      adjustmentQty: 0,
      closingQty: 108,
    },
    {
      id: 3,
      date: "2025-11-20",
      saleQty: 0,
      purchaseQty: 0,
      adjustmentQty: 0,
      closingQty: 108,
    },
  ];

  const filteredData = hideInactive
    ? allData.filter(
      (r) => r.saleQty !== 0 || r.purchaseQty !== 0 || r.adjustmentQty !== 0
    )
    : allData;

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const tempContainer = useRef(null);

  // ===== Excel Download =====
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ItemDetails");
    XLSX.writeFile(
      workbook,
      `ItemDetails_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // ===== PDF Generate =====
  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "fixed";
      tempDiv.style.top = "-9999px";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "210mm";
      tempDiv.style.background = "#fff";
      tempDiv.style.padding = "20px";

      tempDiv.innerHTML = `
            <style>
                body { font-family: Arial, sans-serif; font-size: 11px; }
                h4 { text-align:center; text-decoration:underline; margin-bottom: 12px; }
                table { border-collapse: collapse; width:100%; margin-top:8px; }
                th, td { border:1px solid #000; padding:4px 6px; text-align:center; font-size:11px; }
                th { background:#f1f1f1; font-weight:600; }
            </style>

            <h4>Item Details Report</h4>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Sale Quantity</th>
                        <th>Purchase Quantity</th>
                        <th>Adjustment Quantity</th>
                        <th>Closing Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData
          .map(
            (r, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${r.date}</td>
                        <td>${r.saleQty}</td>
                        <td>${r.purchaseQty}</td>
                        <td>${r.adjustmentQty}</td>
                        <td>${r.closingQty}</td>
                    </tr>`
          )
          .join("")}
                </tbody>
            </table>
        `;

      document.body.appendChild(tempDiv);
      tempContainer.current = tempDiv;

      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setShowPreview(true);
    } catch (err) {
      console.error(err);
    } finally {
      if (tempContainer.current) document.body.removeChild(tempContainer.current);
      setIsGenerating(false);
    }
  };

  const handlePdfAction = (action) => {
    if (action === "print") window.open(pdfUrl)?.print();
    if (action === "open") window.open(pdfUrl, "_blank");
    if (action === "save") {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "ItemDetails.pdf";
      link.click();
    }
  };

  // ===== Table Columns =====
  const columns = [
    { name: "Date", selector: (row) => row.date, sortable: true },
    { name: "Sale Quantity", selector: (row) => row.saleQty },
    { name: "Purchase Quantity", selector: (row) => row.purchaseQty },
    { name: "Adjustment Quantity", selector: (row) => row.adjustmentQty },
    { name: "Closing Quantity", selector: (row) => row.closingQty },
  ];

  const customStyles = {
    headCells: { style: { backgroundColor: "#f8f9fa", fontWeight: 600 } },
    rows: { style: { minHeight: "45px" } },
  };

  return (
    <div
      className="container-fluid bg-light py-4 overflow-auto rounded-3"
      style={{ height: "calc(100vh - 11vh)" }}
    >
      {/* FILTER SECTION */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="d-flex flex-wrap align-items-center gap-2">

          {/* From Date */}
          <Controller
            name="fromDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                className="form-control form-control-sm"
                style={{ width: "150px" }}
              />
            )}
          />

          <span>To</span>

          {/* To Date */}
          <Controller
            name="toDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                className="form-control form-control-sm"
                style={{ width: "150px" }}
              />
            )}
          />
        </div>

        {/* Icons: Excel + Print */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-light border btn-sm d-flex align-items-center gap-1"
            onClick={downloadExcel}
          >
            <i className="bi bi-file-earmark-excel"></i>
          </button>

          <button
            className="btn btn-light border btn-sm d-flex align-items-center gap-1"
            onClick={generatePDF}
            disabled={isGenerating}
          >
            <i className="bi bi-printer"></i>
          </button>
        </div>
      </div>

      <h6 className="fw-bold mb-2">DETAILS</h6>

      {/* Item Name + Checkbox */}
      <div className="d-flex align-items-center mb-3 gap-4">
        <div className="d-flex flex-column">
          <label className="small fw-semibold">Item name</label>
          <Controller
            name="itemName"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                {...field}
                className="form-control form-control-sm"
                style={{ width: "200px" }}
              />
            )}
          />
        </div>

        {/* Hide Inactive Dates */}
        <Controller
          name="hideInactive"
          control={control}
          render={({ field }) => (
            <div className="form-check mt-3">
              <input
                type="checkbox"
                {...field}
                className="form-check-input"
                id="hideInactive"
              />
              <label htmlFor="hideInactive" className="form-check-label">
                Hide inactive dates
              </label>
            </div>
          )}
        />
      </div>

      {/* TABLE AREA */}
      <div
        className="bg-white rounded-3 shadow-sm border overflow-hidden p-3"
        style={{ minHeight: "55vh" }}
      >
        <DataTable
          columns={columns}
          data={filteredData}
          highlightOnHover
          striped
          dense
          customStyles={customStyles}
        />
      </div>

      {/* PDF Modal */}
      <PdfPreviewModal
        pdfUrl={pdfUrl}
        show={showPreview}
        onClose={() => setShowPreview(false)}
        onAction={handlePdfAction}
        title="Item Details – PDF Preview"
      />
    </div>
  );
};

export default ItemDetails;
  