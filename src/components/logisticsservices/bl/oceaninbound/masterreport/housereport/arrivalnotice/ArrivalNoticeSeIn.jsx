import React, { useState, useMemo, useEffect } from "react";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import CreateArrivalNoticeSeaIn from "./CreateArrivalNoticeSeaIn";
import jsPDF from "jspdf";
import moment from "moment";

import Pagination from "../../../../../../common/pagination/Pagination";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";

import { extractItems } from "../../../../../../../utils/extractItems";
import { extractPagination } from "../../../../../../../utils/extractPagination";
import { getOceanInboundArrivalNotices, deleteOceanInboundArrivalNotice } from "../../../oceanInboundApi";

const ArrivalNoticeSeIn = () => {
    const queryClient = useQueryClient();
    const [collapsed, setCollapsed] = useState(false);
    const [editData, setEditData] = useState(null);

    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    /** SESSION DATA */
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") ?? "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") ?? "{}");

    const jobNo = storedMaster?.jobNo ?? "";
    const hblNo =
        storedHouse?.hbl ??
        storedHouse?.hblNo ??
        storedHouse?.houseNumber ??
        "";

    /** API CALL */
    const { data: apiRaw, isLoading, isError } = useQuery({
        queryKey: ["oceanInboundArrivalNotice", jobNo, hblNo, currentPage, pageSize],
        queryFn: () =>
            getOceanInboundArrivalNotices(jobNo, hblNo, {
                page: currentPage,
                pageSize,
            }),
        enabled: Boolean(jobNo && hblNo),
        keepPreviousData: true,
        retry: 1,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => deleteOceanInboundArrivalNotice(jobNo, hblNo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["oceanInboundArrivalNotice", jobNo, hblNo] });
            alert("Arrival Notice deleted successfully");
        },
        onError: (error) => handleProvisionalError(error, "Delete Arrival Notice"),
    });

    const handleDelete = () => {
        if (!jobNo || !hblNo) {
            alert("Job No and HBL No are required");
            return;
        }
        if (window.confirm("Are you sure you want to delete this Arrival Notice?")) {
            deleteMutation.mutate();
        }
    };

    // Print Arrival Notice
    const handlePrint = (item) => {
        if (!item) return;
        generateArrivalNoticePDF(item);
    };

    // Generate PDF for Arrival Notice
    const generateArrivalNoticePDF = (item) => {
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        let yPos = 10;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;

        // Company Header
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("LOM LOGISTICS INDIA PVT.LTD.", pageWidth / 2, yPos, { align: "center" });
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("No 151, Village Road, 7th Floor, GEE GEE EMERALD Building,", pageWidth / 2, yPos, { align: "center" });
        yPos += 5;
        pdf.text("Nungambakkam Chennai-600 034, India", pageWidth / 2, yPos, { align: "center" });
        yPos += 5;
        pdf.text("Phone: +91 7449271782", pageWidth / 2, yPos, { align: "center" });
        yPos += 8;

        // Document Title
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("ARRIVAL NOTICE", pageWidth / 2, yPos, { align: "center" });
        yPos += 10;

        // Arrival Notice Details
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const details = [
            ["CAN No", item?.canNo || ""],
            ["CAN Date", item?.canDate ? moment(item.canDate).format("YYYY-MM-DD") : ""],
            ["Job No", item?.jobNo || ""],
            ["M.B/L No", item?.mblNo || ""],
            ["H.B/L No", item?.hblNo || ""],
            ["Branch", item?.branch || ""],
            ["Shipper", item?.shipperName || ""],
            ["Shipper Address", item?.shipperAddress || ""],
            ["B/L Name", item?.blName || ""],
            ["B/L Address", item?.blAddress || ""],
            ["Consignee", item?.consigneeName || ""],
            ["Consignee Address", item?.consigneeAddress || ""],
            ["Notify", item?.notifyName || ""],
            ["Notify Address", item?.notifyAddress || ""],
            ["Origin", item?.origin || ""],
            ["Destination", item?.destination || ""],
            ["Vessel Name", item?.vesselName || ""],
            ["On Board Date", item?.onBoardDate ? moment(item.onBoardDate).format("YYYY-MM-DD") : ""],
            ["Arrival Date", item?.arrivalDate ? moment(item.arrivalDate).format("YYYY-MM-DD") : ""],
            ["Package", item?.package || ""],
            ["Gross Weight", item?.grossWeight || ""],
            ["No of Container", item?.noOfContainer || ""],
            ["Shipper Invoice No", item?.shipperInvoiceNo || ""],
            ["Shipper Invoice Date", item?.shipperInvoiceDate ? moment(item.shipperInvoiceDate).format("YYYY-MM-DD") : ""],
            ["Shipper Invoice Amount", item?.shipperInvoiceAmount || ""],
            ["Remarks", item?.remarks || ""],
        ];

        details.forEach(([label, value]) => {
            if (yPos > 270) {
                pdf.addPage();
                yPos = 10;
            }
            pdf.setFont("helvetica", "bold");
            pdf.text(`${label}:`, margin, yPos);
            pdf.setFont("helvetica", "normal");
            const textLines = pdf.splitTextToSize(value || "", pageWidth - margin - 60);
            pdf.text(textLines, margin + 50, yPos);
            yPos += textLines.length * 5 + 3;
        });

        // Save PDF
        const fileName = `Arrival_Notice_${item?.canNo || item?.id || "notice"}.pdf`;
        pdf.save(fileName);
    };

    /** SAFE EXTRACTION */
    const allItems = extractItems(apiRaw) ?? [];
    const { totalPages: rawTP, totalCount: rawTC } = extractPagination(apiRaw);

    /** FIXED SAFE PAGINATION VALUES */
    const totalRows = rawTC && rawTC > 0 ? rawTC : allItems.length;

    const totalPages =
        rawTP && rawTP > 0
            ? rawTP
            : Math.max(1, Math.ceil((totalRows || 1) / pageSize));

    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    /** SEARCH FILTERING (same as AirInbound) */
    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return allItems;

        return allItems.filter((row = {}) => {
            return (
                (row.canNo ?? "").toLowerCase().includes(s) ||
                (row.mawbNo ?? "").toLowerCase().includes(s) ||
                (row.hblNo ?? "").toLowerCase().includes(s) ||
                (row.hawbNo ?? "").toLowerCase().includes(s) ||
                (row.shipperName ?? "").toLowerCase().includes(s) ||
                (row.consigneeName ?? "").toLowerCase().includes(s) ||
                JSON.stringify(row).toLowerCase().includes(s)
            );
        });
    }, [allItems, search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    /** PAGINATED RESULT */
    const paginated = filtered.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    return (
        <>
            <CommonSectionHeader
                title="Arrival Notice"
                type="arrivalnotice"
                buttonText="Create Arrival Notice"
                isCollapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                openModalId="seaincreateArrivalNoticeModal"
            />

            {!collapsed && (
                <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-b-lg tw-p-4">

                    {/* SHOW + SEARCH */}
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
                            placeholder="Search by MAWB, HBL, CAN, Shipper, Consignee"
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
                                    <th>HBL No</th>
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
                                        <td
                                            colSpan={7}
                                            className="text-center text-danger py-3"
                                        >
                                            Error loading data
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-muted py-3">
                                            No data available in table
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((item, idx) => (
                                        <tr key={item?.id ?? idx}>
                                            <td>{item?.id ?? ""}</td>
                                            <td>{item?.canNo ?? ""}</td>
                                            <td>{item?.mawbNo ?? ""}</td>
                                            <td>{item?.hblNo ?? item?.hawbNo ?? ""}</td>
                                            <td>{item?.shipperName ?? ""}</td>
                                            <td>{item?.consigneeName ?? ""}</td>

                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary me-1"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#seaincreateArrivalNoticeModal"
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
            <CreateArrivalNoticeSeaIn editData={editData} setEditData={setEditData} />
        </>
    );
};

export default ArrivalNoticeSeIn;
