import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Exports an HTML element to a multi-page A4 PDF with proper page slicing and footers
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.element - The HTML element to convert to PDF
 * @param {string} options.filename - Filename for the PDF (without extension)
 * @param {Function} [options.footerTextFn] - Optional function to generate footer text (page, totalPages) => string
 * @param {number} [options.scale=2] - Canvas scale factor (default: 2 for better quality)
 * @returns {Promise<Blob>} - PDF blob
 */
export const exportA4CanvasToPdf = async ({
    element,
    filename = "document",
    footerTextFn = null,
    scale = 2,
}) => {
    if (!element) {
        throw new Error("Element is required for PDF export");
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
    });

    // Create PDF in A4 format
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate page height in canvas pixels
    // The canvas width represents the element width (210mm)
    // So one page height (297mm) in canvas pixels = (canvas.width / 210) * 297
    const pageHeightPx = (canvas.width / pdfWidth) * pdfHeight;

    // Calculate how many pages we need
    const totalPages = Math.ceil(canvas.height / pageHeightPx);

    // Slice canvas into pages
    for (let page = 1; page <= totalPages; page++) {
        if (page > 1) {
            pdf.addPage();
        }

        // Calculate the source rectangle for this page slice
        const sourceY = (page - 1) * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext("2d");

        // Draw the slice from the original canvas
        pageCtx.drawImage(
            canvas,
            0, // sourceX
            sourceY, // sourceY
            canvas.width, // sourceWidth
            sourceHeight, // sourceHeight
            0, // destX
            0, // destY
            canvas.width, // destWidth
            sourceHeight // destHeight
        );

        // Convert slice to image data
        const imgData = pageCanvas.toDataURL("image/png", 1.0);

        // Calculate dimensions for PDF (convert pixels to mm)
        // The slice height in mm = (sourceHeight / canvas.width) * pdfWidth
        const imgWidthMm = pdfWidth;
        const imgHeightMm = (sourceHeight / canvas.width) * pdfWidth;

        // Add the slice to PDF
        pdf.addImage(
            imgData,
            "PNG",
            0,
            0,
            imgWidthMm,
            imgHeightMm,
            undefined,
            "FAST"
        );

        // Add footer with page number
        const footerText = footerTextFn
            ? footerTextFn(page, totalPages)
            : `Page ${page}`;
        
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        const textWidth = pdf.getTextWidth(footerText);
        pdf.text(
            footerText,
            pdfWidth - textWidth - 10, // Right-aligned with 10mm margin
            pdfHeight - 5 // 5mm from bottom
        );
    }

    // Generate blob
    const blob = pdf.output("blob");
    return blob;
};


