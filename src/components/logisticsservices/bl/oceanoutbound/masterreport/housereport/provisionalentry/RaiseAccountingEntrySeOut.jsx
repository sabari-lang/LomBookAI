// src/components/logisticsservices/bl/oceanoutbound/masterreport/housereport/RaiseAccountingEntrySeaOut.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NewWindow from "react-new-window";
import moment from "moment";
import CustomerSearch from "../../../../../../common/popup/CustomerSearch";

import { handleProvisionalError } from "../../../../../../../utils/handleProvisionalError";
import { MOBILE_OPTIONAL, onlyDigits } from "../../../../../../../utils/validation";
import { createOceanOutboundCustomerAccount, updateOceanOutboundCustomerAccount, getOceanOutboundProvisionals } from "../../../oceanOutboundApi";
import { extractItems } from "../../../../../../../utils/extractItems";

const safeNum = (v) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};
const safeStr = (v) => (v ?? "").toString();
const safeArr = (v) => (Array.isArray(v) ? v : []);

const PAGE_SIZE = 10;

const RaiseAccountingEntrySeaOut = ({ editData, setEditData }) => {
    const queryClient = useQueryClient();

    // session keys: masterAirwayData / houseAirwayData (same as requested)
    const storedMaster = JSON.parse(sessionStorage.getItem("masterAirwayData") || "{}");
    const storedHouse = JSON.parse(sessionStorage.getItem("houseAirwayData") || "{}");

    const jobNo = safeStr(storedMaster?.jobNo);
    const hblNo = safeStr(storedHouse?.hbl || storedHouse?.hblNo || storedHouse?.houseNumber);

    const isEditing = Boolean(editData?.id || editData?._id);
    const [open, setOpen] = useState(false);

    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split('T')[0];
        } catch {
            return "";
        }
    };

    // Fetch provisional entries from API
    const { data: provisionalApiRaw } = useQuery({
        queryKey: ["oceanOutboundProvisionals", jobNo, hblNo],
        queryFn: () => getOceanOutboundProvisionals(jobNo, hblNo, { page: 1, pageSize: 1000 }),
        enabled: Boolean(jobNo && hblNo),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Normalize provisional entries to the format expected by the table
    const provisionalList = useMemo(() => {
        if (!provisionalApiRaw) return [];
        
        const entries = extractItems(provisionalApiRaw) ?? [];
        
        // Flatten all entries and their items into a single list
        return entries.flatMap((entry = {}) => {
            const items = Array.isArray(entry?.items) ? entry.items : [];
            if (items.length === 0) return [];
            
            return items.map((it) => ({
                date: safeStr(it?.provisionalDate ?? it?.date ?? entry?.provisionalDate ?? entry?.date ?? ""),
                status: safeStr(it?.status ?? entry?.status ?? "Accounting Entry (Pending)"),
                account: safeStr(it?.account ?? it?.accountService ?? it?.description ?? ""),
                sac: safeStr(it?.sac ?? ""),
                currency: safeStr(it?.currency ?? "INR"),
                qty: safeNum(it?.qty ?? 1),
                amount: safeStr(safeNum(it?.amount ?? 0).toFixed(2)),
                exRate: safeStr(safeNum(it?.exRate ?? 1).toFixed(2)),
                amountInInr: safeStr(safeNum(it?.amountInInr ?? it?.amountInINR ?? 0).toFixed(2)),
                gst: safeStr(safeNum(it?.gstPer ?? it?.gst ?? 0).toFixed(2)),
                cgst: safeStr(safeNum(it?.cgst ?? 0).toFixed(2)),
                sgst: safeStr(safeNum(it?.sgst ?? 0).toFixed(2)),
                igst: safeStr(safeNum(it?.igst ?? 0).toFixed(2)),
                total: safeStr(safeNum(it?.total ?? 0).toFixed(2)),
            }));
        });
    }, [provisionalApiRaw]);

    // Calculate subtotal and grandTotal
    const { subtotal, grandTotal } = useMemo(() => {
        const sub = provisionalList.reduce((sum, it) => sum + safeNum(it?.amountInInr), 0);
        const grand = provisionalList.reduce((sum, it) => sum + safeNum(it?.total), 0);
        return {
            subtotal: sub.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            grandTotal: grand.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
    }, [provisionalList]);

    const defaultValues = {
        voucherType: "",
        voucherNo: "",
        voucherDate: "",
        baseCurrency: "INR",

        partyName: "",
        partyAddress: "",
        gstin: "",
        tel: "",
        fax: "",
        mobile: "",
        contactPerson: "",

        shipperInvoiceNo: storedHouse?.shipperInvoiceNo ?? storedHouse?.shipper_invoice_no ?? "",
        shipperInvoiceDate: formatDateForInput(storedHouse?.shipperInvoiceDate ?? storedHouse?.shipper_invoice_date),
        shipperInvoiceAmount: storedHouse?.shipperInvoiceAmount ?? storedHouse?.shipper_invoice_amount ?? 0,

        remark: "",

        jobNo,
        hblNo,

        items: [],
    };

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues });

    // Close modal function
    const closeModal = () => {
        reset(defaultValues);
        if (setEditData) setEditData(null);
        
        const modalElement = document.getElementById("seaoutraiseAccountingModalOut");
        if (modalElement) {
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                    return;
                }
            }
            if (window.$) {
                window.$(modalElement).modal("hide");
                return;
            }
            modalElement.classList.remove("show");
            modalElement.style.display = "none";
            const backdrop = document.querySelector(".modal-backdrop");
            if (backdrop) backdrop.remove();
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }
    };

    useEffect(() => {
        if (isEditing && editData) {
            reset({
                ...defaultValues,
                ...editData,
                jobNo,
                hblNo,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, editData]);

    // pagination state (Prev / Next)
    const [page, setPage] = useState(1);
    const pageSize = PAGE_SIZE;
    const totalItems = safeArr(provisionalList).length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return safeArr(provisionalList).slice(start, start + pageSize);
    }, [provisionalList, page, pageSize]);

    const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const endIndex = Math.min(totalItems, page * pageSize);

    const normalizeItems = (rows) =>
        safeArr(rows).map((it) => ({
            provisionalDate: safeStr(it.date),
            status: safeStr(it.status),
            account: safeStr(it.account),
            sac: safeStr(it.sac),
            currency: safeStr(it.currency),
            qty: safeNum(it.qty),
            amount: safeNum(it.amount),
            exRate: safeNum(it.exRate),
            amountInInr: safeNum(it.amountInInr),
            gstPer: safeNum(it.gst ?? it.gstPer),
            cgst: safeNum(it.cgst),
            sgst: safeNum(it.sgst),
            igst: safeNum(it.igst),
            total: safeNum(it.total),
        }));

    // mutations
    const createMutation = useMutation({
        mutationFn: (payload) => createOceanOutboundCustomerAccount(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanOutboundCustomerAccounts", jobNo, hblNo]);
            alert("Ocean Outbound customer accounting entry created");
            closeModal();
        },
        onError: (err) => handleProvisionalError(err, "Create"),
    });

    const updateMutation = useMutation({
        mutationFn: (payload) => updateOceanOutboundCustomerAccount(jobNo, hblNo, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(["oceanOutboundCustomerAccounts", jobNo, hblNo]);
            alert("Ocean Outbound customer accounting entry updated");
            closeModal();
        },
        onError: (err) => handleProvisionalError(err, "Update"),
    });

    const onSubmit = (form) => {
        const payload = {
            ...form,
            jobNo,
            hblNo,
            // Ensure date fields send null if empty (MongoDB compatible)
            voucherDate: form?.voucherDate || null,
            shipperInvoiceDate: form?.shipperInvoiceDate || null,
            items: normalizeItems(provisionalList),
        };

        if (isEditing) updateMutation.mutate(payload);
        else createMutation.mutate(payload);
    };

    return (
        <div
            className="modal fade"
            id="seaoutraiseAccountingModalOut"
            tabIndex={-1}
            aria-hidden="true"
            data-bs-backdrop="static"
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">
                    {/* HEADER */}
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Raise Accounting Entry</h5>
                        <button type="button" className="btn-close" onClick={closeModal}></button>
                    </div>

                    {/* BODY */}
                    <div className="modal-body">
                        <form>
                            {/* ROW 1 */}
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Type</label>
                                    <Controller
                                        name="voucherType"
                                        control={control}
                                        render={({ field }) => (
                                            <select {...field} className="form-select">
                                                <option value="">--Select--</option>
                                                <option value="Purchase">Purchase</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Journal">Journal</option>
                                            </select>
                                        )}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher No</label>
                                    <Controller name="voucherNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Voucher Date</label>
                                    <Controller name="voucherDate" control={control} render={({ field }) => <input type="date" {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Base Currency</label>
                                    <Controller
                                        name="baseCurrency"
                                        control={control}
                                        render={({ field }) => (
                                            <select {...field} className="form-select">
                                                <option value="INR">INR</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* ROW 2 */}
                            <div className="row g-3 mt-2">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Party Name</label>
                                    <div className="input-group">
                                        <Controller name="partyName" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                        <span className="input-group-text" style={{ cursor: "pointer" }} onClick={() => setOpen(true)}>
                                            <FaSearch />
                                        </span>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Party Address</label>
                                    <Controller name="partyAddress" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* ROW 3 */}
                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">GSTIN</label>
                                    <Controller name="gstin" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">TEL</label>
                                    <Controller name="tel" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">FAX</label>
                                    <Controller name="fax" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* ROW 4 */}
                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Mobile No</label>
                                    <Controller
                                        name="mobile"
                                        control={control}
                                        rules={MOBILE_OPTIONAL}
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                onInput={onlyDigits}
                                                className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                                            />
                                        )}
                                    />
                                    {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile.message}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Contact Person</label>
                                    <Controller name="contactPerson" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">Job No</label>
                                    <input className="form-control" value={jobNo} disabled />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-bold">H.B/L No</label>
                                    <input className="form-control" value={hblNo} disabled />
                                </div>
                            </div>

                            {/* ROW 5 */}
                            <div className="row g-3 mt-2">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice No</label>
                                    <Controller name="shipperInvoiceNo" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice Date</label>
                                    <Controller name="shipperInvoiceDate" control={control} render={({ field }) => <input type="date" {...field} className="form-control" />} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Shipper Invoice Amount</label>
                                    <Controller name="shipperInvoiceAmount" control={control} render={({ field }) => <input {...field} className="form-control" />} />
                                </div>
                            </div>

                            {/* REMARK */}
                            <div className="mt-3">
                                <label className="form-label fw-bold">Remark</label>
                                <Controller name="remark" control={control} render={({ field }) => <textarea {...field} className="form-control" rows={3}></textarea>} />
                            </div>

                            {/* PROVISIONAL TABLE */}
                            <div className="mt-3" style={{ overflowX: "auto" }}>
                                <table className="table table-bordered table-sm" style={{ minWidth: "1400px" }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Provisional Date</th>
                                            <th>Status</th>
                                            <th>Account/Service</th>
                                            <th>SAC</th>
                                            <th>Currency</th>
                                            <th>Qty</th>
                                            <th>Amount</th>
                                            <th>Ex.Rate</th>
                                            <th>Amount in INR</th>
                                            <th>GST %</th>
                                            <th>CGST</th>
                                            <th>SGST</th>
                                            <th>IGST</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedRows.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.date ? moment(row.date).format('DD-MM-YYYY') : '-'}</td>
                                                <td>{row.status}</td>
                                                <td>{row.account}</td>
                                                <td>{row.sac}</td>
                                                <td>{row.currency}</td>
                                                <td>{row.qty ?? 1}</td>
                                                <td>{row.amount}</td>
                                                <td>{row.exRate}</td>
                                                <td className="text-success fw-bold">{row.amountInInr}</td>
                                                <td>{row.gst}</td>
                                                <td>{row.cgst}</td>
                                                <td>{row.sgst}</td>
                                                <td>{row.igst}</td>
                                                <td>{row.total}</td>
                                            </tr>
                                        ))}

                                        {paginatedRows.length === 0 && (
                                            <tr>
                                                <td colSpan={14} className="text-center">
                                                    No data available in table
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                <div className="d-flex justify-content-between align-items-center px-2">
                                    <div className="fw-bold">
                                        Showing {startIndex} to {endIndex} of {totalItems} entries
                                    </div>

                                    <div>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                                                    <button
                                                        className="page-link"
                                                        type="button"
                                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                        disabled={page <= 1}
                                                    >
                                                        Previous
                                                    </button>
                                                </li>

                                                <li className="page-item disabled">
                                                    <span className="page-link">{page}</span>
                                                </li>

                                                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                                                    <button
                                                        className="page-link"
                                                        type="button"
                                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                                        disabled={page >= totalPages}
                                                    >
                                                        Next
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer">
                        <button className="btn btn-light" onClick={closeModal}>
                            Cancel
                        </button>

                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit(onSubmit)}
                            disabled={createMutation.isLoading || updateMutation.isLoading}
                        >
                            {(createMutation.isLoading || updateMutation.isLoading) ? (
                                <>
                                    <i className="fa fa-circle-o-notch fa-spin"></i> &nbsp;Loading
                                </>
                            ) : (
                                "Raise Account Entry"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {open && (
                <NewWindow
                    onUnload={() => setOpen(false)}
                    title="Search Customer"
                    features="width=1100,height=700,scrollbars=yes,resizable=yes"
                >
                    <CustomerSearch
                        onSelect={(cust) => {
                            const name = cust?.displayName ?? cust?.customerName ?? cust?.name ?? "";
                            const address = cust?.billingAddress?.street1 
                                ? `${cust.billingAddress.street1}${cust.billingAddress.street2 ? ', ' + cust.billingAddress.street2 : ''}${cust.billingAddress.city ? ', ' + cust.billingAddress.city : ''}${cust.billingAddress.state ? ', ' + cust.billingAddress.state : ''}${cust.billingAddress.pincode ? ' - ' + cust.billingAddress.pincode : ''}`
                                : (cust?.address ?? "");
                            const gstin = cust?.gstin ?? cust?.gstNumber ?? cust?.taxId ?? "";
                            const tel = cust?.phone ?? cust?.workPhone ?? "";
                            const fax = cust?.fax ?? "";
                            const mobile = cust?.mobilePhone ?? cust?.mobile ?? "";

                            setValue("partyName", name);
                            setValue("partyAddress", address);
                            setValue("gstin", gstin);
                            setValue("tel", tel);
                            setValue("fax", fax);
                            setValue("mobile", mobile);

                            setOpen(false);
                        }}
                    />
                </NewWindow>
            )}
        </div>
    );
};

export default RaiseAccountingEntrySeaOut;
