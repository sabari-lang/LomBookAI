import React from "react";

const ViewValueAddedService = ({ viewData, setViewData }) => {
    const close = () => {
        const modalEl = document.getElementById("viewValueAddedServiceModal");
        try {
            if (window.bootstrap && modalEl) {
                const inst = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                inst.hide();
                return;
            }
        } catch (e) {
            // ignore
        }
        const closeBtn = modalEl?.querySelector('.btn-close') || document.querySelector('#viewValueAddedServiceModal [data-bs-dismiss="modal"]');
        if (closeBtn) closeBtn.click();
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (modalEl) {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        setViewData?.(null);
    };

    if (!viewData) return null;

    return (
        <div
            className="modal fade"
            id="viewValueAddedServiceModal"
            tabIndex="-1"
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Value Added Service - View</h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            onClick={close}
                        ></button>
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        <div className="container-fluid">
                            {/* First Row */}
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Job No</label>
                                    <p className="form-control-plaintext">{viewData?.jobNo || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Master No</label>
                                    <p className="form-control-plaintext">{viewData?.masterNo || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">House No</label>
                                    <p className="form-control-plaintext">{viewData?.houseNo || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Branch</label>
                                    <p className="form-control-plaintext">{viewData?.branch || "-"}</p>
                                </div>
                            </div>

                            {/* Second Row */}
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Type</label>
                                    <p className="form-control-plaintext">{viewData?.type || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Job Close Date</label>
                                    <p className="form-control-plaintext">{viewData?.jobCloseDate || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Invoice Date</label>
                                    <p className="form-control-plaintext">{viewData?.invoiceDate || "-"}</p>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Status</label>
                                    <p className="form-control-plaintext">
                                        <span className={`badge ${viewData?.status === "Open" ? "bg-success" : "bg-secondary"}`}>
                                            {viewData?.status || "Open"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            {viewData?.fields && Array.isArray(viewData.fields) && viewData.fields.length > 0 && (
                                <>
                                    {viewData.fields.map((field, index) => (
                                        field?.fieldName || field?.fieldValue ? (
                                            <div key={index} className="row mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">Select Field {index + 1}</label>
                                                    <p className="form-control-plaintext">{field?.fieldName || "-"}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold">value{index + 1}</label>
                                                    <p className="form-control-plaintext">{field?.fieldValue || "-"}</p>
                                                </div>
                                            </div>
                                        ) : null
                                    ))}
                                </>
                            )}

                            {/* Remarks */}
                            <div className="row mb-3">
                                <div className="col-md-12">
                                    <label className="form-label fw-bold">Remarks</label>
                                    <p className="form-control-plaintext">{viewData?.remarks || "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            data-bs-dismiss="modal"
                            onClick={close}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewValueAddedService;

