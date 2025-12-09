import React from "react";

const Popup = ({ show, onClose, invoice, type }) => {
    if (!show) return null;

    // ✅ WhatsApp API Trigger
    const handleWhatsApp = () => {
        const phone = "919876543210"; // Replace with actual customer's number (with country code)
        const message = encodeURIComponent(
            `Hello! 👋\nHere is your invoice from Denver.\n\nInvoice No: ${invoice?.invoiceNumber || "1"}\nDate: ${invoice?.date || "30/10/2025"}\nAmount: ₹${invoice?.totalAmount || "22,420.00"}\n\nThank you for your business!`
        );
        const url = `https://wa.me/${phone}?text=${message}`;
        window.open(url, "_blank");
        onClose();
    };

    // ✅ Email API Trigger
    const handleEmail = () => {
        const recipient = "customer@example.com"; // Replace with actual customer email
        const subject = encodeURIComponent(
            `Invoice #${invoice?.invoiceNumber || "1"} from Denver`
        );
        const body = encodeURIComponent(
            `Dear ${invoice?.customerName || "Customer"},\n\nPlease find your invoice details below:\n\nInvoice No: ${invoice?.invoiceNumber || "1"}\nDate: ${invoice?.date || "30/10/2025"}\nAmount: ₹${invoice?.totalAmount || "22,420.00"}\n\nThank you for your business!\n\n— Denver`
        );

        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        onClose();
    };

    return (
        <div
            className="modal d-flex align-items-center justify-content-center show fade"
            style={{
                display: "block",
                background: "rgba(0,0,0,0.5)",
                zIndex: 1050,
            }}
        >
            {type === "salesInvoice" && (
                <div
                    className="modal-dialog modal-dialog-centered"
                    style={{ maxWidth: "300px", width: "90%" }}
                >
                    <div className="modal-content p-3 rounded-3">
                        {/* ===== HEADER ===== */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 fw-semibold">
                                Share Invoice {invoice?.invoiceNumber || ""}
                            </h6>
                            <i
                                className="bi bi-x-lg"
                                style={{ cursor: "pointer", fontSize: "1rem" }}
                                onClick={onClose}
                            ></i>
                        </div>

                        {/* ===== BODY ===== */}
                        <div className="d-flex justify-content-around py-3 flex-wrap gap-3">
                            {/* WhatsApp Share */}
                            <div
                                className="text-center"
                                style={{ cursor: "pointer" }}
                                onClick={handleWhatsApp}
                            >
                                <i className="bi bi-whatsapp fs-3 text-success"></i>
                                <div className="small">WhatsApp</div>
                            </div>

                            {/* Email Share */}
                            <div
                                className="text-center"
                                style={{ cursor: "pointer" }}
                                onClick={handleEmail}
                            >
                                <i className="bi bi-envelope fs-3 text-primary"></i>
                                <div className="small">Email</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Popup;
