import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const CashFlow = ({ data, totalIncome, totalExpense }) => {
    const openingCash = 0;
    const closingCash = totalIncome - totalExpense;

    return (
        <div className="card shadow-sm border-0 mt-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0 fw-semibold">Cash Flow</h6>
                <button className="btn btn-light btn-sm border">
                    This Fiscal Year ▾
                </button>
            </div>

            <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-start">
                <div
                    className="flex-grow-1"
                    style={{
                        minWidth: "70%",
                        height: "260px",
                        borderRight: "1px solid #eee",
                    }}
                >
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
                                tickFormatter={(v) => `${(v / 1000).toFixed(1)}K`}
                            />
                            <Tooltip formatter={(val) => `₹${val.toFixed(2)}`} />
                            <Line
                                type="monotone"
                                dataKey="cash"
                                stroke="#007bff"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="px-3" style={{ minWidth: "200px" }}>
                    <p className="mb-2 text-muted small">Cash as on 01/04/2025</p>
                    <h6 className="fw-bold mb-3">₹{openingCash.toFixed(2)}</h6>

                    <p className="text-success mb-1 small fw-semibold">Incoming</p>
                    <h6 className="fw-bold text-success mb-3">
                        ₹{totalIncome.toLocaleString()} +
                    </h6>

                    <p className="text-danger mb-1 small fw-semibold">Outgoing</p>
                    <h6 className="fw-bold text-danger mb-3">
                        ₹{totalExpense.toLocaleString()} -
                    </h6>

                    <p className="text-primary mb-1 small fw-semibold">
                        Cash as on 31/03/2026
                    </p>
                    <h6 className="fw-bold text-primary mb-0">
                        ₹{closingCash.toLocaleString()} =
                    </h6>
                </div>
            </div>
        </div>
    );
};

export default CashFlow;
