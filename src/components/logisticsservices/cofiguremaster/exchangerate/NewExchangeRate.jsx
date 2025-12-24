import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notifySuccess } from "@/utils/notifications";
import {
  createExchangeRate,
  updateExchangeRate,
  getCurrencies,
} from "../api";

const DEFAULTS = {
  date: "",
  currencyCode: "",
  exchangeAmount: "",
};

const NewExchangeRate = ({ editData, setEditData }) => {
  const isEditing = Boolean(editData?.id);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: DEFAULTS,
  });

  const queryClient = useQueryClient();

  // Fetch currencies for dropdown
  const { data: currencyList = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
  });

  // CREATE
  const createMutation = useMutation({
    mutationFn: createExchangeRate,
    onSuccess: () => {
      queryClient.invalidateQueries(["exchangeRates"]);
      notifySuccess("Exchange Rate Added!");
      closeModal();
    },
  });

  // UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateExchangeRate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["exchangeRates"]);
      notifySuccess("Exchange Rate Updated!");
      closeModal();
    },
  });

  useEffect(() => {
    if (editData) reset(editData);
    else reset(DEFAULTS);
  }, [editData]);

  // CLOSE MODAL
  const closeModal = () => {
    const modal = document.getElementById("newExchangeRateModal");
    const bs = window.bootstrap;

    if (bs) {
      const instance =
        bs.Modal.getInstance(modal) || new bs.Modal(modal);
      instance.hide();
    }

    setEditData(null);
  };

  const onSubmit = (values) => {
    if (isEditing) {
      updateMutation.mutate({ id: editData.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div
      className="modal fade"
      id="newExchangeRateModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content">

          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {isEditing ? "Edit Exchange Rate" : "Daily Exchange Rate"}
            </h5>

            {/* FIXED CLOSE BUTTON */}
            <button
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={closeModal}
            ></button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="container-fluid">

                {/* DATE */}
                <div className="mb-3">
                  <label className="fw-bold">Exchange Date</label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="form-control"
                      />
                    )}
                  />
                </div>

                {/* CURRENCY CODE */}
                <div className="mb-3">
                  <label className="fw-bold">Currency Code</label>
                  <Controller
                    name="currencyCode"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="form-select">
                        <option value="">-Select Code-</option>
                        {currencyList.map((c) => (
                          <option key={c.id} value={c.currencyCode}>
                            {c.currencyCode}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* EXCHANGE AMOUNT */}
                <div className="mb-3">
                  <label className="fw-bold">Exchange Amount</label>
                  <Controller
                    name="exchangeAmount"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className="form-control"
                        placeholder="Amount"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">

              {/* FIXED CANCEL BUTTON */}
              <button
                className="btn btn-secondary"
                type="button"
                data-bs-dismiss="modal"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button className="btn btn-primary" type="submit">
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default NewExchangeRate;
