import React from "react";

const PdfPreviewModal = ({ pdfUrl, show, onClose, onAction, title = "PDF Preview" }) => {
    if (!show) return null;

    return (
        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,0.4)",
                zIndex: 1050,
            }}
        >
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body p-0" style={{ height: "80vh" }}>
                        {pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                title="PDF Preview"
                                style={{ width: "100%", height: "100%", border: "none" }}
                            ></iframe>
                        ) : (
                            <p className="text-center mt-4">Generating PDF Preview...</p>
                        )}
                    </div>

                    <div className="modal-footer flex-wrap justify-content-between">
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => onAction("open")}
                            >
                                Open PDF
                            </button>
                            <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => onAction("save")}
                            >
                                Save PDF
                            </button>
                            <button
                                className="btn btn-outline-dark btn-sm"
                                onClick={() => onAction("print")}
                            >
                                Print
                            </button>
                            <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => onAction("email")}
                            >
                                Email PDF
                            </button>
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={onClose}
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
