import React, { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const IncomeExpense = ({ data, totalIncome, totalExpense }) => {
    const [viewMode, setViewMode] = useState("Cash");

    return (
        <div className="row g-3 mt-4">
            {/* Income and Expense */}
            <div className="col-md-8">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                        <h6 className="mb-0 fw-semibold">Income and Expense</h6>
                        <button className="btn btn-light btn-sm border">
                            This Fiscal Year ▾
                        </button>
                    </div>

                    <div className="card-body">
                        <div className="d-flex justify-content-end mb-2">
                            <div className="btn-group btn-group-sm">
                                <button
                                    className={`btn ${viewMode === "Accrual"
                                            ? "btn-primary text-white"
                                            : "btn-outline-secondary"
                                        }`}
                                    onClick={() => setViewMode("Accrual")}
                                >
                                    Accrual
                                </button>
                                <button
                                    className={`btn ${viewMode === "Cash"
                                            ? "btn-primary text-white"
                                            : "btn-outline-secondary"
                                        }`}
                                    onClick={() => setViewMode("Cash")}
                                >
                                    Cash
                                </button>
                            </div>
                        </div>

                        <div style={{ width: "100%", height: "240px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, "auto"]}
                                    />
                                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#28a745"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        stroke="#ff6f61"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <hr />
                        <div className="d-flex justify-content-around text-center">
                            <div>
                                <p className="small text-success fw-semibold mb-1">
                                    Total Income
                                </p>
                                <h6 className="fw-bold mb-0">
                                    ₹{totalIncome.toLocaleString()}
                                </h6>
                            </div>
                            <div>
                                <p className="small text-danger fw-semibold mb-1">
                                    Total Expenses
                                </p>
                                <h6 className="fw-bold mb-0">
                                    ₹{totalExpense.toLocaleString()}
                                </h6>
                            </div>
                        </div>
                        <p className="text-muted small mt-2 text-center">
                            * Income and expense values displayed are exclusive of taxes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Top Expenses */}
            <div className="col-md-4">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                        <h6 className="mb-0 fw-semibold">Top Expenses</h6>
                        <button className="btn btn-light btn-sm border">
                            This Fiscal Year ▾
                        </button>
                    </div>
                    <div className="card-body text-center text-muted py-5">
                        No Expense recorded for this fiscal year
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeExpense;
