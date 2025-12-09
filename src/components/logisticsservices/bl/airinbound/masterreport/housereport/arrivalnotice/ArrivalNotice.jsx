import React, { useState, useMemo, useEffect } from "react";
import { FaEdit, FaTrash, FaPrint } from "react-icons/fa";
import CommonSectionHeader from "../../../../navbar/CommonSectionHeader";
import CreateArrivalNotice from "./CreateArrivalNotice";
import jsPDF from "jspdf";
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
        </>
    );
};

export default ArrivalNotice;
