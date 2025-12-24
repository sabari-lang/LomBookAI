import React, { useEffect, useRef } from "react";
import { notifySuccess, notifyError, notifyInfo } from "../../../utils/notifications";

/**
 * PdfPreviewModal - Displays a PDF in an iframe with action buttons
 * 
 * Props:
 * - pdfUrl: Object URL or data URL for the PDF
 * - show: Boolean to show/hide modal
 * - onClose: Function called when modal closes (should clean up pdfUrl)
 * - onAction: Function called with action type ("open", "save", "print", "email")
 * - title: Modal title (default: "PDF Preview")
 * - isLoading: Optional boolean to show loading state while PDF is being generated
 * - error: Optional error message to display
 */
const PdfPreviewModal = ({ 
    pdfUrl, 
    show, 
    onClose, 
    onAction, 
    title = "PDF Preview",
    isLoading = false,
    error = null
}) => {
    const iframeRef = useRef(null);
    
    // Handle escape key to close modal
    useEffect(() => {
        if (!show) return;
        
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };
        
        document.addEventListener("keydown", handleEscape);
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
        
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [show, onClose]);

    if (!show) return null;

    // Handle close with proper cleanup
    const handleClose = () => {
        onClose?.();
    };

    // Handle action with validation
    const handleAction = (action) => {
        if (!pdfUrl && action !== "close") {
            notifyInfo("PDF is not ready yet. Please wait.");
            return;
        }
        onAction?.(action);
    };

    return (
        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,0.5)",
                zIndex: 1055,
            }}
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleClose}
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body p-0" style={{ height: "80vh", position: "relative" }}>
                        {/* Error State */}
                        {error && (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <i className="fa fa-exclamation-triangle text-danger" style={{ fontSize: "48px" }}></i>
                                <p className="text-danger mt-3 text-center">{error}</p>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary mt-2" 
                                    onClick={handleClose}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                        
                        {/* Loading State */}
                        {!error && (isLoading || !pdfUrl) && (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Generating PDF Preview...</p>
                            </div>
                        )}
                        
                        {/* PDF Preview */}
                        {!error && !isLoading && pdfUrl && (
                            <iframe
                                ref={iframeRef}
                                src={pdfUrl}
                                title="PDF Preview"
                                style={{ width: "100%", height: "100%", border: "none" }}
                            ></iframe>
                        )}
                    </div>

                    <div className="modal-footer flex-wrap justify-content-between">
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleAction("open")}
                                disabled={!pdfUrl || isLoading}
                            >
                                <i className="fa fa-external-link me-1"></i>
                                Open PDF
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-success btn-sm"
                                onClick={() => handleAction("save")}
                                disabled={!pdfUrl || isLoading}
                            >
                                <i className="fa fa-download me-1"></i>
                                Save PDF
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-dark btn-sm"
                                onClick={() => handleAction("print")}
                                disabled={!pdfUrl || isLoading}
                            >
                                <i className="fa fa-print me-1"></i>
                                Print
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleAction("email")}
                                disabled={!pdfUrl || isLoading}
                            >
                                <i className="fa fa-envelope me-1"></i>
                                Email PDF
                            </button>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;
