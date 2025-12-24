import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "../../items/api";
import { extractItems } from "../../../utils/extractItems";

export default function ItemSearch({ onSelect }) {
    const [filter, setFilter] = useState("");

    const { data: rawItems, isLoading, isError } = useQuery({
        queryKey: ["items", "item-search-popup"],
        queryFn: () => getItems({ Page: 1, PageSize: 500 }),
        keepPreviousData: true,
        retry: 1,
    });

    const items = useMemo(() => extractItems(rawItems) || [], [rawItems]);

    const visible = useMemo(() => {
        const q = String(filter ?? "").trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => {
            const name = String(item?.name ?? item?.itemName ?? item?.title ?? "").toLowerCase();
            const sku = String(item?.sku ?? item?.code ?? "").toLowerCase();
            const hsn = String(item?.hsn ?? item?.sac ?? "").toLowerCase();
            const idStr = String(item?.id ?? item?.itemId ?? "");
            return name.includes(q) || sku.includes(q) || hsn.includes(q) || idStr.includes(q);
        });
    }, [items, filter]);

    // Helper to get item name
    const getItemName = (item) => {
        return item?.name ?? item?.itemName ?? item?.title ?? "Unnamed item";
    };

    // Helper to get HSN code
    const getHsnCode = (item) => {
        return item?.hsn ?? item?.sac ?? "";
    };

    return (
        <div className="p-3">
            <h5 className="mb-3">Search Items</h5>

            <input
                className="form-control mb-3"
                placeholder="Search by name, SKU, HSN code or ID..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />

            {isLoading ? (
                <div>Loading items...</div>
            ) : isError ? (
                <div className="text-danger">Failed to load items</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered mb-0">
                        <thead>
                            <tr>
                                <th style={{ width: 60 }}>ID</th>
                                <th>Item Name</th>
                                <th>HSN/SAC Code</th>
                                <th style={{ width: 120 }}>Select</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted">No items found</td>
                                </tr>
                            ) : (
                                visible.map((item) => {
                                    const itemName = getItemName(item);
                                    const hsnCode = getHsnCode(item);
                                    return (
                                        <tr key={item?.id ?? item?.itemId ?? JSON.stringify(item ?? {})}>
                                            <td>{item?.id ?? item?.itemId ?? "-"}</td>
                                            <td>{itemName}</td>
                                            <td>{hsnCode || "-"}</td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => onSelect({ name: itemName, hsnCode })}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
