import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../../sales/api";
import { extractItems } from "../../../utils/extractItems";

export default function CustomerSearch({ onSelect }) {
    const [filter, setFilter] = useState("");

    const { data: rawCustomers, isLoading, isError } = useQuery({
        queryKey: ["sales-customers", "customer-search-popup"],
        queryFn: () => getCustomers({ Page: 1, PageSize: 500 }),
        keepPreviousData: true,
        retry: 1,
    });

    const customers = useMemo(() => extractItems(rawCustomers) || [], [rawCustomers]);

    const visible = useMemo(() => {
        const q = String(filter ?? "").trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => {
            const name = String(c?.displayName ?? c?.customerName ?? c?.name ?? "").toLowerCase();
            const addr = String(c?.address ?? c?.billingAddress?.street1 ?? c?.billingAddress?.city ?? "").toLowerCase();
            const phone = String(c?.mobilePhone ?? c?.phone ?? "").toLowerCase();
            const idStr = String(c?.id ?? c?.customerId ?? "");
            return name.includes(q) || addr.includes(q) || phone.includes(q) || idStr.includes(q);
        });
    }, [customers, filter]);

    return (
        <div className="p-3">
            <h5 className="mb-3">Search Customers</h5>

            <input
                className="form-control mb-3"
                placeholder="Search by name, id, phone or address..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />

            {isLoading ? (
                <div>Loading customers...</div>
            ) : isError ? (
                <div className="text-danger">Failed to load customers</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>ID</th>
                                <th>Customer Name</th>
                                <th>Address</th>
                                <th style={{ width: 120 }}>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted">No customers found</td>
                                </tr>
                            ) : (
                                visible.map((c) => (
                                    <tr key={c?.id ?? c?.customerId ?? JSON.stringify(c ?? {})}>
                                        <td>{c?.id ?? c?.customerId ?? "-"}</td>
                                        <td>{c?.displayName ?? c?.customerName ?? c?.name ?? ""}</td>
                                        <td>{c?.address ?? c?.billingAddress?.street1 ?? c?.billingAddress?.city ?? ""}</td>
                                        <td>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => onSelect(c)}
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
