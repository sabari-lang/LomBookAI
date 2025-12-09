import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVendors } from "../../purchases/api";
import { extractItems } from "../../../utils/extractItems";

export default function VendorSearch({ onSelect }) {
    const [filter, setFilter] = useState("");

    const { data: rawVendors, isLoading, isError } = useQuery({
        queryKey: ["purchases-vendors", "vendor-search-popup"],
        queryFn: () => getVendors({ Page: 1, PageSize: 500 }),
        keepPreviousData: true,
        retry: 1,
    });

    const vendors = useMemo(() => extractItems(rawVendors) || [], [rawVendors]);

    const visible = useMemo(() => {
        const q = String(filter ?? "").trim().toLowerCase();
        if (!q) return vendors;
        return vendors.filter((v) => {
            const name = String(v?.displayName ?? v?.vendorName ?? v?.companyName ?? v?.name ?? "").toLowerCase();
            const addr = String(v?.address ?? v?.billingAddress?.street1 ?? v?.billingAddress?.city ?? "").toLowerCase();
            const phone = String(v?.mobilePhone ?? v?.phone ?? v?.workPhone ?? "").toLowerCase();
            const idStr = String(v?.id ?? v?.vendorId ?? "");
            return name.includes(q) || addr.includes(q) || phone.includes(q) || idStr.includes(q);
        });
    }, [vendors, filter]);

    return (
        <div className="p-3">
            <h5 className="mb-3">Search Vendors</h5>

            <input
                className="form-control mb-3"
                placeholder="Search by name, id, phone or address..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />

            {isLoading ? (
                <div>Loading vendors...</div>
            ) : isError ? (
                <div className="text-danger">Failed to load vendors</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>ID</th>
                                <th>Vendor Name</th>
                                <th>Address</th>
                                <th style={{ width: 120 }}>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted">No vendors found</td>
                                </tr>
                            ) : (
                                visible.map((v) => (
                                    <tr key={v?.id ?? v?.vendorId ?? JSON.stringify(v ?? {})}>
                                        <td>{v?.id ?? v?.vendorId ?? "-"}</td>
                                        <td>{v?.displayName ?? v?.vendorName ?? v?.companyName ?? v?.name ?? ""}</td>
                                        <td>{v?.address ?? v?.billingAddress?.street1 ?? v?.billingAddress?.city ?? ""}</td>
                                        <td>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={() => onSelect(v)}
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

