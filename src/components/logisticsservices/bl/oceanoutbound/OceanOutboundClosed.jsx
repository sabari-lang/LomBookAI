// OceanOutboundClosedComp.jsx
import React, { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";


import Pagination from "../../../common/pagination/Pagination";
import { extractItems } from "../../../../utils/extractItems";
import { extractPagination } from "../../../../utils/extractPagination";
import { confirm } from "../../../../utils/confirm";
import {
  deleteOceanOutboundJob,
  getOceanOutboundClosedJobs,
} from "./oceanOutboundApi";

const OceanOutboundClosedComp = () => {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingJobKey, setDeletingJobKey] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteOceanOutboundJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oceanOutboundClosed"], exact: false });
    },
    onSettled: () => setDeletingJobKey(null),
  });

  const handleDelete = async (row = {}) => {
    const jobNo = row.jobNo;
    if (!jobNo) return;
    const confirmed = await confirm(`Delete Ocean Outbound job ${jobNo}?`);
    if (!confirmed) return;
    setDeletingJobKey(jobNo);
    deleteMutation.mutate(jobNo);
  };

  // -------------------------------------------------------------
  // API — Server-side pagination
  // -------------------------------------------------------------
  const { data: apiRaw, isLoading, isError } = useQuery({
    queryKey: ["oceanOutboundClosed", currentPage, pageSize],
    queryFn: () =>
      getOceanOutboundClosedJobs({
        Page: currentPage,
        PageSize: pageSize,
      }),
    keepPreviousData: true,
    retry: 1,
  });

  // -------------------------------------------------------------
  // Extract items returned by API
  // -------------------------------------------------------------
  const items = useMemo(() => {
    return apiRaw?.data?.items ?? extractItems(apiRaw) ?? [];
  }, [apiRaw]);

  // -------------------------------------------------------------
  // Server-side pagination metadata
  // -------------------------------------------------------------
  const { totalPages, totalCount } = extractPagination(apiRaw?.data ?? apiRaw);

  // -------------------------------------------------------------
  // Client-side search
  // -------------------------------------------------------------
  const filtered = useMemo(() => {
    const s = (search ?? "").toLowerCase().trim();
    if (!s) return items;

    return items.filter((row = {}) =>
      ([
        row.jobNo,
        row.masterNumber,
        row.hblNo,
        row.shipperName,
        row.consigneeName,
        row.blType,
      ]
        .filter(Boolean)
        .join(" "))
        .toLowerCase()
        .includes(s)
    );
  }, [items, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // backend already returns paginated results, so display filtered page
  const rowsToRender = filtered;

  const handlePageChange = (page) => {
    if (!page) return;
    setCurrentPage(Number(page));
  };

  return (
    <>
      <div className="container-fluid mt-3">

        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center px-3 py-2 rounded-top"
          style={{ backgroundColor: "#0097A7", color: "white" }}
        >
          <h5 className="m-0">Ocean Outbound - Closed</h5>
        </div>

        <div className="p-3 border border-top-0 rounded-bottom bg-white">

          {/* Top Controls */}
          <div className="row mb-3">
            <div className="col-md-6 d-flex align-items-center gap-2">
              <label>Page Size</label>
              <select
                className="form-select form-select-sm"
                style={{ width: "120px" }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <label className="fw-bold me-2">Search:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search Job No, HBL, Shipper…"
                style={{ width: "240px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <table className="table table-bordered table-striped table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Master No</th>
                  <th>Job No</th>
                  <th>HBL</th>
                  <th>Shipment</th>
                  <th>Status</th>
                  <th>Shipper</th>
                  <th>Consignee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary me-2"></div>
                      Loading…
                    </td>
                  </tr>
                )}

                {isError && (
                  <tr>
                    <td colSpan={9} className="text-center text-warning py-3">
                      Error loading data
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && rowsToRender.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-3">
                      No closed jobs found.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  !isError &&
                  rowsToRender.map((row) => (
                    <tr key={row.id ?? row.masterNumber}>
                      <td>{row.id ?? "—"}</td>
                      <td>{row.masterNumber ?? "—"}</td>
                      <td>{row.jobNo ?? "—"}</td>
                      <td>{row.hblNo ?? "—"}</td>
                      <td>{row.shipment ?? "—"}</td>

                      <td>
                        <span className="badge bg-success">
                          {row.status ?? "Closed"}
                        </span>
                      </td>

                      <td>{row.shipperName ?? "—"}</td>
                      <td>{row.consigneeName ?? "—"}</td>

                      <td>
                        {/* Edit */}
                        <button
                          className="btn btn-sm btn-success me-1"
                          onClick={() => {
                            setSelected(row);
                            setShowModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>

                        {/* View */}
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            sessionStorage.setItem(
                              "masterOceanDataOutbound",
                              JSON.stringify(row)
                            );
                            navigate("/ocean-outbound/masterreport");
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                          <button
                            className="btn btn-sm btn-danger ms-1"
                            disabled={
                              deletingJobKey === (row.jobNo ?? row.hblNo ?? row.masterNumber ?? row.id) &&
                              deleteMutation.isLoading
                            }
                            onClick={() => handleDelete(row)}
                            title="Delete job"
                          >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount ?? rowsToRender.length)} of{" "}
              {totalCount ?? rowsToRender.length} entries
            </span>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages ?? 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {/* {showModal && (
        <JobCreation
          onClose={() => {
            setShowModal(false);
            setSelected(null);
          }}
          editData={selected}
          setEditData={setSelected}
        />
      )} */}
    </>
  );
};

export default OceanOutboundClosedComp;
