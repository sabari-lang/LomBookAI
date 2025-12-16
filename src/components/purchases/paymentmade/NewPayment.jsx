import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPayment, updatePayment } from "../api";
import { handleProvisionalError } from "../../../utils/handleProvisionalError";
import { useUnlockInputs } from "../../../hooks/useUnlockInputs";

const DEFAULTS = {
  vendorName: "",
  paymentNo: "",
  paymentMade: "INR",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentMode: "",
  paidThrough: "",
  reference: "",
  notes: "",
  billList: [],
  gstTreatment: "",
  sourceOfSupply: "",
  destinationOfSupply: "",
  reverseCharge: false,
  tds: "",
  depositTo: "",
  attachments: [],
  vendorAdvanceDescription: "",
};

const NewPayment = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const queryClient = useQueryClient();
  const editId = state?.id;
  const isNewFromInvoice = state?.isNew === true;
  const isEditing = Boolean(editId) && !isNewFromInvoice;

  // ✅ Keyboard unlock hook for edit mode
  useUnlockInputs(isEditing);

  const [activeTab, setActiveTab] = useState("bill");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (state) {
      if (isNewFromInvoice) {
        console.info("💰 [PAYMENT FROM INVOICE]", {
          sourceInvoiceId: state?.sourceInvoiceId,
          sourceInvoiceNumber: state?.sourceInvoiceNumber,
          conversionTimestamp: state?.conversionTimestamp,
        });
      }
      reset({ ...DEFAULTS, ...state });
      if (state.attachments) {
        setUploadedFiles(state.attachments);
        setValue("attachments", state.attachments);
      }
      return;
    }

    reset(DEFAULTS);
    setUploadedFiles([]);
    setValue("attachments", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024);
    const transformed = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setUploadedFiles((prev) => {
      const updated = [...prev, ...transformed].slice(0, 5);
      setValue("attachments", updated);
      return updated;
    });
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    setValue("attachments", updated);
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["payments"]);
      alert("Payment recorded successfully");
      reset(DEFAULTS);
      setUploadedFiles([]);
      setValue("attachments", []);
      navigate("/paymentsmade");
    },
    onError: (error) => handleProvisionalError(error, "Create Payment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["payments"]);
      alert("Payment updated successfully");
      navigate("/paymentsmade");
    },
    onError: (error) => handleProvisionalError(error, "Update Payment"),
  });

  const onSubmit = (data) => {
    try {
      // validations for conversion
      if (isNewFromInvoice) {
        if (!data?.paidThrough && !data?.depositTo) {
          handleProvisionalError(new Error('Payment account is required'), 'Validation', '❌ Select paid through or deposit account');
          return;
        }
        if (!data?.paymentDate) {
          handleProvisionalError(new Error('Payment Date required'), 'Validation', '❌ Payment date is required');
          return;
        }
      }

      // Build payload matching DEFAULTS structure exactly
      const payload = {
        vendorName: data?.vendorName || "",
        paymentNo: data?.paymentNo || "",
        paymentMade: data?.paymentMade || "INR",
        paymentDate: data?.paymentDate ? new Date(data.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        paymentMode: data?.paymentMode || "",
        paidThrough: data?.paidThrough || "",
        reference: data?.reference || "",
        notes: data?.notes || "",
        billList: Array.isArray(data?.billList) ? data.billList : [],
        gstTreatment: data?.gstTreatment || "",
        sourceOfSupply: data?.sourceOfSupply || "",
        destinationOfSupply: data?.destinationOfSupply || "",
        reverseCharge: Boolean(data?.reverseCharge),
        tds: data?.tds || "",
        depositTo: data?.depositTo || "",
        attachments: uploadedFiles.length > 0 ? uploadedFiles : (data?.attachments || []),
        vendorAdvanceDescription: data?.vendorAdvanceDescription || "",
      };

      if (isEditing && !isNewFromInvoice) {
        console.info('[PAYMENT UPDATE]', {
          id: editId,
          vendorName: payload.vendorName,
          payload: payload
        });
        updateMutation.mutate({ id: editId, payload });
        return;
      }

      console.info('[PAYMENT CREATE] mode:', isNewFromInvoice ? 'NEW FROM INVOICE (POST)' : 'NEW (POST)', {
        vendorName: payload.vendorName,
        payload: payload
      });
      createMutation.mutate(payload);
    } catch (err) {
      console.error('[PAYMENT SUBMIT ERROR]', err);
      handleProvisionalError(err, 'Payment Submit', err?.message || 'Failed to submit payment');
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;


  return (
    <div className="container-fluid bg-light rounded-3 pt-0 pb-3 px-4 m-0">
      <div
        className="d-flex justify-content-between align-items-center pt-3 pb-2"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#f8f9fa",
          borderBottom: "1px solid rgba(0,0,0,0.10)",
        }}
      >
        <h5 className="fw-semibold m-0 d-flex align-items-center gap-2"><i className="bi bi-credit-card-2-front me-1"></i>New Payment</h5>

        <button className="btn btn-light btn-sm border" type="button" onClick={() => navigate('/paymentsmade')}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "bill" ? "active" : ""}`}
            onClick={() => setActiveTab("bill")}
            type="button"
          >
            Bill Payment
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "advance" ? "active" : ""}`}
            onClick={() => setActiveTab("advance")}
            type="button"
          >
            Vendor Advance
          </button>
        </li>
      </ul>

      <form onSubmit={handleSubmit(onSubmit)} className="py-2">
        {/* Common Fields */}
        <div className="mb-3">
          <label className="form-label fw-semibold text-danger">
            Vendor Name*
          </label>
          <Controller
            name="vendorName"
            control={control}
            render={({ field }) => (
              <select {...field} className="form-select form-select-sm">
                <option value="">Select Vendor</option>
                <option value="IT">IT</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            )}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold text-danger">
            Payment #*
          </label>
          <Controller
            name="paymentNo"
            control={control}
            render={({ field }) => (
              <div className="input-group input-group-sm">
                <input {...field} className="form-control" />
                <span className="input-group-text">
                  <i className="bi bi-gear"></i>
                </span>
              </div>
            )}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold text-danger">
            Payment Made*
          </label>
          <Controller
            name="paymentMade"
            control={control}
            render={({ field }) => (
              <input {...field} className="form-control form-control-sm" />
            )}
          />
        </div>

        <div className="alert alert-light border small py-2">
          💡 Initiate payments for your bills directly by integrating with your
          bank.{" "}
          <a href="#" className="text-primary text-decoration-none">
            Set Up Now
          </a>
        </div>

        {/* Bill Payment Tab */}
        {activeTab === "bill" && (
          <>
            <div className="mb-3">
              <label className="form-label fw-semibold text-danger">
                Payment Date*
              </label>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <input {...field} type="date" className="form-control form-control-sm" />
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Payment Mode</label>
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Paid Through</label>
              <Controller
                name="paidThrough"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select an account</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash Account">Cash Account</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Deposit To</label>
              <Controller
                name="depositTo"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select an account</option>
                    <option value="Prepaid Expenses">Prepaid Expenses</option>
                    <option value="Advance to Vendor">Advance to Vendor</option>
                  </select>
                )}
              />
            </div>

            {/* Empty Table */}
            <div className="border rounded p-3 mb-3">
              <label className="form-label fw-semibold">Reference#</label>
              <Controller
                name="reference"
                control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" />
                )}
              />

              <div className="table-responsive mt-3">
                <table className="table table-bordered align-middle small">
                  <thead className="table-light text-center">
                    <tr>
                      <th>Date</th>
                      <th>Bill#</th>
                      <th>PO#</th>
                      <th>Bill Amount</th>
                      <th>Amount Due</th>
                      <th>Payment Made on</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-3">
                        There are no bills for this vendor.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-end small text-muted mt-2">
                <strong>Total:</strong> 0.00
              </div>

              <div className="alert alert-light border small mt-3">
                <div className="d-flex justify-content-between">
                  <span>Amount Paid:</span>
                  <span>0.00</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Amount Used for Payments:</span>
                  <span>0.00</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Amount Refunded:</span>
                  <span>0.00</span>
                </div>
                <div className="d-flex justify-content-between text-warning">
                  <span>Amount in Excess:</span>
                  <span>₹ 0.00</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Vendor Advance Tab */}
        {activeTab === "advance" && (
          <>
            <div className="mb-3">
              <label className="form-label fw-semibold text-danger">TDS</label>
              <Controller
                name="tds"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select a Tax</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="12">12%</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-danger">
                Payment Date*
              </label>
              <Controller
                name="paymentDate"
                control={control}
                render={({ field }) => (
                  <input {...field} type="date" className="form-control form-control-sm" />
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Payment Mode</label>
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold text-danger">
                Paid Through*
              </label>
              <Controller
                name="paidThrough"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Bank Account">Bank Account</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Deposit To</label>
              <Controller
                name="depositTo"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="Prepaid Expenses">Prepaid Expenses</option>
                    <option value="Advance to Vendor">Advance to Vendor</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Reference#</label>
              <Controller
                name="reference"
                control={control}
                render={({ field }) => (
                  <input {...field} className="form-control form-control-sm" />
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Deposit To</label>
              <Controller
                name="depositTo"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select an account</option>
                    <option value="Prepaid Expenses">Prepaid Expenses</option>
                    <option value="Advance to Vendor">Advance to Vendor</option>
                  </select>
                )}
              />
            </div>

            {/* GST Fields */}
            <div className="mb-3">
              <label className="form-label fw-semibold">GST Treatment</label>
              <Controller
                name="gstTreatment"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select GST Treatment</option>
                    <option value="Registered Business - Regular">Registered Business - Regular</option>
                    <option value="Registered Business - Composition">Registered Business - Composition</option>
                    <option value="Unregistered Business">Unregistered Business</option>
                    <option value="Consumer">Consumer</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Source of Supply</label>
              <Controller
                name="sourceOfSupply"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select State</option>
                    <option value="[TN] - Tamil Nadu">[TN] - Tamil Nadu</option>
                    <option value="[KA] - Karnataka">[KA] - Karnataka</option>
                    <option value="[MH] - Maharashtra">[MH] - Maharashtra</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Destination of Supply</label>
              <Controller
                name="destinationOfSupply"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-select form-select-sm">
                    <option value="">Select State</option>
                    <option value="[TN] - Tamil Nadu">[TN] - Tamil Nadu</option>
                    <option value="[KA] - Karnataka">[KA] - Karnataka</option>
                    <option value="[MH] - Maharashtra">[MH] - Maharashtra</option>
                  </select>
                )}
              />
            </div>

            <div className="mb-3">
              <div className="form-check">
                <Controller
                  name="reverseCharge"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="checkbox"
                      className="form-check-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <label className="form-check-label">Reverse Charge</label>
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div className="mb-3">
          <label className="form-label fw-semibold">
            Notes (Internal use. Not visible to vendor)
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                className="form-control form-control-sm"
                rows="3"
                placeholder="Enter notes for internal use"
              ></textarea>
            )}
          />
        </div>

        {/* File Upload */}
        {/* <div className="mb-3">
          <label className="form-label fw-semibold">Attachments</label>
          <div className="d-flex align-items-center gap-2">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.png,.docx"
              className="form-control form-control-sm w-auto"
              onChange={handleFileUpload}
            />
            <small className="text-muted">
              You can upload a maximum of 5 files, 10 MB each
            </small>
          </div>

          {uploadedFiles.length > 0 && (
            <ul className="mt-2 small list-unstyled">
              {uploadedFiles.map((file, i) => (
                <li key={i} className="d-flex align-items-center gap-2">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger py-0 px-2"
                    onClick={() => removeAttachment(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div> */}

   

        {/* Buttons */}
        <div className="d-flex gap-2 mt-4">
          {/* <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isSaving}
            onClick={handleSubmit(onSubmit)}
          >
            {isSaving ? (isEditing ? "Updating draft..." : "Saving draft...") : "Save as Draft"}
          </button> */}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSaving}
          >
            {isSaving ? (isEditing ? "Updating payment..." : "Saving payment...") : "Save as Paid"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            disabled={isSaving}
            onClick={() => navigate("/paymentsmade")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPayment;
