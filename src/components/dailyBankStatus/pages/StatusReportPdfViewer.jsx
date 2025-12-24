import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getStatusReportPdfUrl } from "../api/dailyBankStatusApi";

const StatusReportPdfViewer = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const dsdate = queryParams.get("dsdate");

    const pdfUrl = useMemo(() => getStatusReportPdfUrl({ date: dsdate }), [dsdate]);

    return (
        <div className="container-fluid p-0">
            <div className="card shadow-sm m-3">
                <div className="d-flex justify-content-end px-3 pt-2 small text-muted">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="#/">Home</a></li>
                            <li className="breadcrumb-item">Status Report</li>
                            <li className="breadcrumb-item active" aria-current="page">PDF</li>
                        </ol>
                    </nav>
                </div>

                <div className="bg-primary text-white fw-semibold px-3 py-2">
                    <h5 className="m-0">Status Report</h5>
                </div>

                <div className="card-body p-0">
                    <iframe
                        title="Daily Bank Status Report"
                        className="w-100"
                        style={{ height: "calc(100vh - 120px)" }}
                        src={pdfUrl}
                    />
                </div>
            </div>
        </div>
    );
};

export default StatusReportPdfViewer;

