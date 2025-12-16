import React, { useState, useMemo, useEffect } from "react";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import CreateArrivalNotice from "./CreateArrivalNotice";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfPreviewModal from "../../../../../../common/popup/PdfPreviewModal";
import moment from "moment";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Pagination from "../../../../../../common/pagination/Pagination";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";

import { getAirInboundArrivalNotices, deleteAirInboundArrivalNotice } from "../../../Api";

import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";

const ArrivalNotice = () => {
    const queryClient = useQueryClient();
    const [collapsed, setCollapsed] = useState(false);
    const [editData, setEditData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");

    // Cleanup blob URL when modal closes or component unmounts
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    /** ================================
     *  SESSION
     *  ================================ */
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hawb =
        storedHouse?.hawb ??
        storedHouse?.hawbNo ??
        storedHouse?.houseNumber ??
        "";

    /** ================================
     *  API CALL (AirInboundComp pattern)
     *  ================================ */
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["airInboundArrivalNotice", jobNo, hawb, currentPage, pageSize],
        queryFn: () =>
            getAirInboundArrivalNotices(jobNo, hawb, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hawb),
        keepPreviousData: true,
        retry: 1,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteAirInboundArrivalNotice(jobNo, hawb),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["airInboundArrivalNotice", jobNo, hawb] });
            alert("Arrival Notice deleted successfully");
        },
        onError: (error) => handleProvisionalError(error, "Delete Arrival Notice"),
    });

    const handleDelete = () => {
        if (!jobNo || !hawb) {
            alert("Job No and HAWB are required");
            return;
        }
        if (window.confirm("Are you sure you want to delete this Arrival Notice?")) {
            deleteMutation.mutate();
        }
    };

    /** ================================
     *  SAFE ITEMS
     *  ================================ */
    const allItems = extractItems(apiRaw) ?? [];

    /** ================================
     *  SAFE PAGINATION NORMALIZATION
     *  ================================ */
    const { totalPages: rawTP, totalCount: rawTC } = extractPagination(apiRaw);

    // FIX: If backend returns 0 totalCount but items exist, use items.length
    const totalRows = rawTC && rawTC > 0 ? rawTC : allItems.length;

    // FIX: Compute safe total pages
    const totalPages =
        rawTP && rawTP > 0
            ? rawTP
            : Math.max(1, Math.ceil((totalRows || 1) / pageSize));

    // FIX: Prevent invalid page number
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    /** ================================
     *  SEARCH (MAWB / HAWB / CAN / shipper / consignee)
     *  ================================ */
    const filtered = useMemo(() => {
        const s = (search ?? "").toLowerCase().trim();
        if (!s) return allItems;

        return allItems.filter((row = {}) => {
            return (
                (row.canNo ?? "").toLowerCase().includes(s) ||
                (row.mawbNo ?? "").toLowerCase().includes(s) ||
                (row.hawbNo ?? "").toLowerCase().includes(s) ||
                (row.shipperName ?? "").toLowerCase().includes(s) ||
                (row.consigneeName ?? "").toLowerCase().includes(s) ||
                JSON.stringify(row).toLowerCase().includes(s)
            );
        });
    }, [allItems, search]);

    // Reset page on new search
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    /** ================================
     *  PAGINATED RESULT
     *  ================================ */
    const paginated = filtered.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    const buildPrintableHtml = (row = {}) => {
        const safe = (v, d = "") => (v ?? "").toString() || d;
        const fmtDate = (d) => (d ? moment(d).format("DD-MM-YYYY") : "");
        const charges = Array.isArray(row.charges) ? row.charges : [];
        const grandTotal = charges.reduce((sum, c) => sum + Number(c?.total ?? 0), 0).toFixed(2);
        const rowsHtml = charges.map((c) => `
            <tr>
                <td>${safe(c.description)}</td>
                <td class="text-end">${safe(c.currency)}</td>
                <td class="text-end">${safe(c.amount)}</td>
                <td class="text-end">${safe(c.exRate)}</td>
                <td class="text-end">${safe(c.amountInInr ?? c.amountInINR)}</td>
                <td class="text-end">${safe(c.cgst)}</td>
                <td class="text-end">${safe(c.sgst)}</td>
                <td class="text-end">${safe(c.igst)}</td>
                <td class="text-end">${safe(c.total)}</td>
            </tr>
        `).join("");

        return `
        <div id="arrival-print-view" class="a4 sheet p-3">
            <style>
            /* Page + base typography */
            .a4 { width: 210mm; background: #fff; }
            .sheet { box-sizing: border-box; margin: 0 auto; }
            .small { font-size: 11.5px; line-height: 1.35; color:#000; font-family: Arial, Helvetica, sans-serif; }
            .title { text-align:center; font-weight:700; margin: 4px 0; font-size: 16px; letter-spacing: 0.2px; }
            .section-title { text-align:center; font-weight:700; margin:6px 0; font-size: 14px; }

            /* Header block */
            .header { border:1px solid #222; padding:10px 8px; margin-bottom:6px; }
            .header .line { text-align:center; font-size: 11.5px; }

            /* Two column boxes */
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .box { border:1px solid #222; padding:6px; min-height: 42mm; }
            .label { font-weight:700; }
            .muted { color:#111; }

            /* Tables */
            .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .table td, .table th { border:1px solid #222; padding: 6px 8px; font-size: 11.5px; }
            .table th { font-weight:700; }
            .text-end { text-align: right; }

            /* Details block spacing */
            .details { margin-top: 6px; }

            /* Charges footer */
            .grant-row td { font-weight:700; }
            </style>
            <div class="small">
                <div class="header">
                    <div class="title" style="margin:0">LOM LOGISTICS INDIA PVT LTD</div>
                    <div class="line">No. 151 , Village Road, 7th Fl, Gee Gee Emerald B/D, Nungambakkam, Chennai- 600 034</div>
                    <div class="line">INDIA Tel: 9940198526 Fax: +91-44-66455913 e-mail: airin@lom-logistics.com URL: www.lomindia.com</div>
                </div>
                <div class="section-title">AIR CARGO ARRIVAL NOTICE CUM INVOICE</div>
                <div class="grid" style="margin:8px 0;">
                    <div class="box">
                        <div class="label muted">CAN NO:</div>
                        <div>${safe(row.canNo)}</div>
                        <div class="label muted" style="margin-top:6px;">Consignee:</div>
                        <div>${safe(row.consigneeName)}<br/>${safe(row.consigneeAddress)}</div>
                        <div class="label muted" style="margin-top:6px;">Shipper:</div>
                        <div>${safe(row.shipperName)}<br/>${safe(row.shipperAddress)}</div>
                    </div>
                    <div class="box">
                        <div class="label muted">CAN Date:</div>
                        <div>${fmtDate(row.canDate)}</div>
                        <div class="label muted" style="margin-top:6px;">Notify:</div>
                        <div>${safe(row.notifyName)}<br/>${safe(row.notifyAddress)}</div>
                    </div>
                </div>

                <div class="title">IMPORTANT NOTICE</div>
                <div class="small" style="margin-bottom:8px;">
                    <ol>
                        <li>Shipment arrived. Contact Import Desk for documents and DOs.</li>
                        <li>Produce Letter of Authority when approaching for DOs.</li>
                        <li>Payment by DD/Cash only.</li>
                        <li>Exchange rate subject to upward revision.</li>
                    </ol>
                </div>

                <table class="table details">
                    <tbody>
                        <tr><td>Ref NO</td><td>${safe(jobNo)}</td><td>Package(s)</td><td class="text-end">${safe(row.piecesRCP ?? row.pieces)} PCS</td></tr>
                        <tr><td>MAWB No & Date</td><td>${safe(row.mawbNo)}</td><td>Chargable Weight</td><td class="text-end">${safe(row.chargeableWeight)}</td></tr>
                        <tr><td>HAWB No & Date</td><td>${safe(row.hawbNo)}</td><td>Gross Weight</td><td class="text-end">${safe(row.grossWeight)}</td></tr>
                        <tr><td>Airline</td><td>${safe(row.airwbName)}</td><td>Origin</td><td>${safe(row.origin)}</td></tr>
                        <tr><td>Flight No & Date</td><td>${safe(row.flightNo)} ${fmtDate(row.arrivalDate)}</td><td>Destination</td><td>${safe(row.destination)}</td></tr>
                        <tr><td>IGM No & Date</td><td></td><td>Exchange Rate</td><td>INR ${safe(row.exRate ?? 1)}</td></tr>
                        <tr><td>Said to Contain</td><td colspan="3"></td></tr>
                    </tbody>
                </table>

                <table class="table" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th style="width:40%">Description</th>
                            <th style="width:6%">Cur</th>
                            <th style="width:8%">Amt</th>
                            <th style="width:10%">Ex.Rate</th>
                            <th style="width:12%">Amt(IND)</th>
                            <th style="width:6%">CGST</th>
                            <th style="width:6%">SGST</th>
                            <th style="width:6%">IGST</th>
                            <th style="width:10%">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || `<tr><td colspan="9" class="text-end">No charges</td></tr>`}
                        <tr class="grant-row">
                            <td colspan="4" class="text-end">GRANT TOTAL</td>
                            <td class="text-end">INR</td>
                            <td colspan="3"></td>
                            <td class="text-end">${grandTotal}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="small" style="margin-top:8px;">
                    GST No: 33AABCL0207A1ZK
                    <ul>
                        <li>Letter of authority required for bank DO.</li>
                        <li>Collect shipments need certificate for freight in INR.</li>
                        <li>Delivery order hours: Mon-Fri 9:30–13:00, 14:00–17:00; Sat 10:00–15:00.</li>
                    </ul>
                </div>
            </div>
        `;
    };

    const handlePrint = async (row) => {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-10000px';
        container.innerHTML = buildPrintableHtml(row || {});
        document.body.appendChild(container);

        const node = container.querySelector('#arrival-print-view');
        const canvas = await html2canvas(node, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setShowPreview(true);
        document.body.removeChild(container);
    };

    const handlePdfAction = (action) => {
        if (!pdfUrl) return;
        switch (action) {
            case 'open': {
                window.open(pdfUrl, '_blank');
                break;
            }
            case 'save': {
                const a = document.createElement('a');
                a.href = pdfUrl;
                a.download = `arrival-notice-${jobNo}-${hawb}.pdf`;
                a.click();
                break;
            }
            case 'print': {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                iframe.src = pdfUrl;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                    iframe.contentWindow?.focus?.();
                    iframe.contentWindow?.print?.();
                    setTimeout(() => document.body.removeChild(iframe), 1000);
                };
                break;
            }
            case 'email': {
                // Placeholder for future email integration
                alert('Email action is not configured yet.');
                break;
            }
            default:
                break;
        }
    };

    return (
        <>
            {/* HEADER */}
            <CommonSectionHeader
                title="Arrival Notice"
                type="arrivalnotice"
                buttonText="Create Arrival Notice"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                openModalId="createArrivalNoticeModal"
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">
                    {/* FILTER ROW */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <label className="me-2">Show</label>
                            <select
                                className="form-select d-inline-block w-auto"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option>10</option>
                                <option>25</option>
                                <option>50</option>
                            </select>
                            <span className="ms-2">entries</span>
                        </div>

                        <input
                            className="form-control w-25"
                            placeholder="Search by MAWB No, HAWB No, CAN No, Shipper, Consignee"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* TABLE */}
                    <div className="table-responsive">
                        <table className="table table-bordered table-striped table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>CAN No</th>
                                    <th>MAWB No</th>
                                    <th>HAWB No</th>
                                    <th>Shipper</th>
                                    <th>Consignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-danger py-3">
                                            Error loading data
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-3">
                                            No data found
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((item, index) => (
                                        <tr key={item?.id ?? index}>
                                            <td>{item?.id ?? ""}</td>
                                            <td>{item?.canNo ?? ""}</td>
                                            <td>{item?.mawbNo ?? ""}</td>
                                            <td>{item?.hawbNo ?? ""}</td>
                                            <td>{item?.shipperName ?? ""}</td>
                                            <td>{item?.consigneeName ?? ""}</td>

                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#createArrivalNoticeModal"
                                                    onClick={() => setEditData(item)}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success me-1"
                                                    onClick={() => handlePrint(item)}
                                                    title="Print Arrival Notice"
                                                >
                                                    <FaPrint />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={handleDelete}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION FOOTER */}
                    <div className="d-flex justify-content-between mt-2">
                        <span>
                            Showing{" "}
                            {totalRows === 0
                                ? 0
                                : (safePage - 1) * pageSize + 1}{" "}
                            to {Math.min(safePage * pageSize, totalRows)} of{" "}
                            {totalRows} entries
                        </span>

                        <Pagination
                            currentPage={safePage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                </div>
            )}

            {/* MODAL */}
            <CreateArrivalNotice editData={editData} setEditData={setEditData} />

            <PdfPreviewModal
                show={showPreview}
                pdfUrl={pdfUrl}
                title="Arrival Notice PDF Preview"
                onClose={() => {
                    setShowPreview(false);
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setPdfUrl("");
                }}
                onAction={handlePdfAction}
            />
        </>
    );
};

export default ArrivalNotice;
