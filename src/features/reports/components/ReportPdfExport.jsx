import { forwardRef, useImperativeHandle, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * ReportPdfExport - Simple PDF export for reports
 * Uses jspdf-autotable for reliable table rendering
 */
const ReportPdfExport = forwardRef((props, ref) => {
  
  /**
   * Generate PDF and return blob URL for preview
   */
  const generatePdf = useCallback(({
    title = 'Report',
    columns = [],
    rows = [],
    filters = {},
    companyName = 'LOM LOGISTICS INDIA PVT LTD',
  }) => {
    try {
      // Create PDF in A4 landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 10;

      // --- Header: Company Name ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(companyName, pageWidth / 2, 15, { align: 'center' });

      // --- Subtitle: Report Title (underlined) ---
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const titleY = 22;
      pdf.text(title, pageWidth / 2, titleY, { align: 'center' });
      
      // Draw underline
      const titleTextWidth = pdf.getTextWidth(title);
      const titleX = (pageWidth - titleTextWidth) / 2;
      pdf.setLineWidth(0.3);
      pdf.line(titleX, titleY + 1, titleX + titleTextWidth, titleY + 1);

      // --- Date Range ---
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const fromDate = filters?.fromDate || '';
      const toDate = filters?.toDate || '';
      pdf.text(`From: ${fromDate}    To: ${toDate}`, margin, 30);

      // --- Prepare Table Data ---
      // Filter visible columns (exclude checkbox)
      const visibleColumns = columns.filter(
        (col) => col.visible !== false && col.key !== 'checkbox'
      );

      // Table headers
      const tableHeaders = visibleColumns.map((col) => col.label || col.key);

      // Table body - format values
      const tableBody = rows.map((row) =>
        visibleColumns.map((col) => {
          let value = row[col.key];

          // Handle null/undefined
          if (value === null || value === undefined) {
            return '-';
          }

          // Format numbers
          if (typeof value === 'number') {
            value = value.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }

          // Add % for margin/percent columns
          if (
            col.key.toLowerCase().includes('margin') ||
            col.key.toLowerCase().includes('percent')
          ) {
            value = `${value} %`;
          }

          return String(value);
        })
      );

      // --- Generate Table with autoTable ---
      autoTable(pdf, {
        startY: 35,
        head: [tableHeaders],
        body: tableBody,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 8,
        },
        bodyStyles: {
          halign: 'left',
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        // Add page number footer
        didDrawPage: () => {
          const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const footerText = `Page ${pageNumber}`;
          pdf.text(footerText, pageWidth - margin - 15, pageHeight - 5);
        },
      });

      // Generate blob URL
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      return url;
    } catch (error) {
      console.error('[ReportPdfExport] Error generating PDF:', error);
      throw error;
    }
  }, []);

  /**
   * Download PDF directly without preview
   */
  const downloadPdf = useCallback((options) => {
    const url = generatePdf(options);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.title?.replace(/\s+/g, '_') || 'report'}_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatePdf]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    generatePdf,
    downloadPdf,
  }), [generatePdf, downloadPdf]);

  // This component renders nothing - it's logic-only
  return null;
});

ReportPdfExport.displayName = 'ReportPdfExport';

export default ReportPdfExport;
