import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DataTable from "react-data-table-component";

const ItemWiseDiscount = () => {
    const { control } = useForm({
        defaultValues: {
            period: "This Month",
            fromDate: "2025-11-01",
            toDate: "2025-11-30",
            firm: "ALL FIRMS",
            itemName: "",
            category: "All Categories",
        },
    });

    // REAL data (empty)
    const realData = [];

    // Trick: Add a dummy invisible row only if data is empty
    const tableData =
        realData.length === 0
            ? [
                  {
                      dummy: true,
                      itemName: "",
                      totalQtySold: "",
                      totalSaleAmount: "",
                      totalDiscAmount: "",
                      avgDisc: "",
                  },
              ]
            : realData;

    // Table columns
    const columns = [
        {
            name: "#",
            width: "60px",
            center: true,
            cell: (row, index) => (row.dummy ? "" : index + 1),
        },
        {
            name: "ITEM NAME",
            selector: (row) => row.itemName,
            wrap: true,
        },
        {
            name: "TOTAL QTY SOLD",
            selector: (row) => row.totalQtySold,
            center: true,
        },
        {
            name: "TOTAL SALE AMOUNT",
            selector: (row) => row.totalSaleAmount,
            center: true,
            cell: (row) => (row.totalSaleAmount ? `₹ ${row.totalSaleAmount}` : ""),
        },
        {
            name: "TOTAL DISC. AMOUNT",
            selector: (row) => row.totalDiscAmount,
            center: true,
            cell: (row) => (row.totalDiscAmount ? `₹ ${row.totalDiscAmount}` : ""),
        },
        {
            name: "AVG. DISC. (%)",
            selector: (row) => row.avgDisc,
            center: true,
            cell: (row) => (row.avgDisc ? `${row.avgDisc}%` : ""),
        },
        {
            name: "Details",
            width: "100px",
            center: true,
            cell: (row) =>
                row.dummy ? "" : <button className="btn btn-sm btn-outline-primary">View</button>,
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: "#f8f9fa",
                fontWeight: "600",
                fontSize: "13px",
                paddingTop: "10px",
                paddingBottom: "10px",
            },
        },
        rows: {
            style: (row) => ({
                minHeight: row.dummy ? "0px" : "45px", // reduce dummy row height
                padding: row.dummy ? "0px" : "auto",
                opacity: row.dummy ? 0 : 1, // hide the dummy row
                height: row.dummy ? "0px" : "auto",
            }),
        },
    };

    return (
        <div
            className="container-fluid bg-light py-4 overflow-auto rounded-3"
            style={{ height: "calc(100vh - 11vh)" }}
        >
            {/* TOP FILTER BAR */}
            <div className="d-flex justify-content-between flex-wrap align-items-center mb-4">

                <div className="d-flex align-items-center flex-wrap gap-2">

                    {/* This Month */}
                    <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className="form-select fw-bold text-primary border-0"
                                style={{
                                    background: "#E7F1FF",
                                    width: "150px",
                                    height: "38px",
                                }}
                            >
                                <option>This Month</option>
                                <option>Last Month</option>
                            </select>
                        )}
                    />

                    {/* Between */}
                    <button
                        className="btn btn-secondary fw-semibold"
                        style={{ height: "38px" }}
                    >
                        Between
                    </button>

                    {/* From Date */}
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                {...field}
                                className="form-control"
                                style={{ width: "150px", height: "38px" }}
                            />
                        )}
                    />

                    <span className="fw-semibold">To</span>

                    {/* To Date */}
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <input
                                type="date"
                                {...field}
                                className="form-control"
                                style={{ width: "150px", height: "38px" }}
                            />
                        )}
                    />

                    {/* Firm */}
                    <Controller
                        name="firm"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className="form-select fw-semibold"
                                style={{ width: "150px", height: "38px" }}
                            >
                                <option>ALL FIRMS</option>
                                <option>ABC Traders</option>
                            </select>
                        )}
                    />
                </div>

                <div className="d-flex align-items-center gap-4">
                    <div className="text-center">
                        <i className="bi bi-file-earmark-excel fs-4"></i>
                        <div style={{ fontSize: "12px" }}>Excel Report</div>
                    </div>

                    <div className="text-center">
                        <i className="bi bi-printer fs-4"></i>
                        <div style={{ fontSize: "12px" }}>Print</div>
                    </div>
                </div>
            </div>

            {/* TITLE */}
            <h6 className="fw-bold mb-2">Item Wise Discount</h6>

            {/* SECOND FILTER ROW */}
            <div className="d-flex flex-wrap gap-3 mb-3">
                {/* Item Name */}
                <div>
                    <label className="fw-semibold small">ITEM NAME</label>
                    <Controller
                        name="itemName"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "220px" }}
                            />
                        )}
                    />
                </div>

                {/* Category */}
                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <select
                            {...field}
                            className="form-select form-select-sm"
                            style={{ width: "150px" }}
                        >
                            <option>All Categories</option>
                            <option>Electronics</option>
                        </select>
                    )}
                />

                {/* Party Filter */}
                <input
                    disabled
                    placeholder="Party Filter"
                    className="form-control form-control-sm bg-light"
                    style={{ width: "150px" }}
                />
            </div>

            {/* --------------- DATATABLE (Header + No Items) --------------- */}
            <div
                className="bg-white rounded-3 shadow-sm border p-3"
                style={{ minHeight: "50vh" }}
            >
                <DataTable
                    columns={columns}
                    data={tableData}
                    highlightOnHover
                    dense
                    customStyles={customStyles}
                    noTableHead={false}
                    noDataComponent={
                        <div className="text-center py-5">No Items</div>
                    }
                />
            </div>

            {/* SUMMARY */}
            <div className="mt-4 fw-bold">
                <div>Summary</div>
                <div>Total Sale Amount: ----</div>
                <div>Total Discount Amount: ----</div>
            </div>
        </div>
    );
};

export default ItemWiseDiscount;
