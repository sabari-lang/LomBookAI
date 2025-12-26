import React, { useState } from "react";
import CommonSectionHeader from "../logisticsservices/bl/navbar/CommonSectionHeader";

const OpeningBalances = () => {
    const [entries, setEntries] = useState(10);
    const [searchValue, setSearchValue] = useState("");

    // Dummy sample data
    const sampleData = [
        {
            party: "AAR BEE FREIGHT FORWARDERS PRIVATE LIMITED",
            debit: 48187.95,
            credit: 0,
        },
        {
            party: "ACOUSTICS INDIA PVT LTD.,",
            debit: 52507.28,
            credit: 0,
        },
        {
            party: "ALINA PRIVATE LIMITED",
            debit: 10133.84,
            credit: 0,
        },
        {
            party: "ALLTRANS SHIPPING AND LOGISTICS LLP",
            debit: 76085.50,
            credit: 0,
        },
        {
            party: "ALPHALOGIS CO., LTD,",
            debit: 0.00,
            credit: 74187.19,
        },
    ];

    const format = (num) => Number(num).toLocaleString();

    return (
        <div className="container-fluid p-4">

            {/* BLUE HEADER (Using CommonSectionHeader) */}
            <CommonSectionHeader
                title="Opening Balance"
                type="master"  // BLUE HEADER COLOR
                buttonText="Create Opening Balance"
                newButtonModalId="createOpeningModal"
                onNewButtonClick={() => {}}
            />

            <div className="card shadow-sm mx-0 mb-4">
                <div className="card-body">

                    {/* ---- TOP CONTROLS (STATIC) ---- */}
                    <div className="d-flex justify-content-between align-items-center px-2 mb-2">

                        {/* LEFT: Show Entries */}
                        <div className="d-flex align-items-center gap-2">
                            <span>Show</span>

                            <select
                                className="form-select form-select-sm"
                                style={{ width: "70px" }}
                                value={entries}
                                onChange={(e) => setEntries(e.target.value)}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>

                            <span>entries</span>
                        </div>

                        {/* RIGHT: Search Box */}
                        <div className="d-flex align-items-center gap-2">
                            <span>Search:</span>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ width: "200px" }}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ---- TABLE ---- */}
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle mb-0">

                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: "50px" }}>S.No</th>
                                    <th>Party Name</th>
                                    <th style={{ width: "120px" }}>Debit</th>
                                    <th style={{ width: "120px" }}>Credit</th>
                                    <th style={{ width: "120px" }}>Net</th>
                                    <th style={{ width: "80px" }}>View</th>
                                </tr>
                            </thead>

                            <tbody>
                                {sampleData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-3">
                                            No data available
                                        </td>
                                    </tr>
                                ) : (
                                    sampleData.map((row, index) => {
                                        const net = row.debit - row.credit;

                                        return (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{row.party}</td>

                                                <td className="fw-semibold text-success">
                                                    {format(row.debit)}
                                                </td>

                                                <td className="fw-semibold text-danger">
                                                    {format(row.credit)}
                                                </td>

                                                <td
                                                    className={`fw-semibold ${
                                                        net >= 0 ? "text-success" : "text-danger"
                                                    }`}
                                                >
                                                    {format(net)}
                                                    {net >= 0 ? " Dr" : " Cr"}
                                                </td>

                                                <td className="text-center">
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{
                                                            width: "34px",
                                                            height: "34px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: "4px",
                                                        }}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>

                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OpeningBalances;
