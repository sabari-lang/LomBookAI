// InvoiceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const InvoiceSlice = createSlice({
    name: "invoices",
    initialState: [], // array of invoice rows
    reducers: {
        upsertManyInvoices(state, action) {
            const incoming = Array.isArray(action.payload) ? action.payload : [];
            for (const item of incoming) {
                const key = item?.id; // 👈 must exist
                if (!key) continue;
                const i = state.findIndex((t) => t.id === key);
                if (i === -1) state.push(item); // add new
                else state[i] = { ...state[i], ...item }; // update existing
            }
        },

        removeInvoice(state, action) {
            return state?.filter((t) => t.invoiceNumber !== action.payload);
        },
        // (Optional) replaceAllInvoices — DO NOT call this if you want add-only
        replaceAllInvoices(state, action) {
            return Array.isArray(action.payload) ? action.payload : [];
        },
        clearInvoices() {
            return []; // ✅ resets state to empty array
        },
    },
});

export const {
    upsertManyInvoices,
    removeInvoice,
    clearInvoices,
    //   replaceAllInvoices, // don't use if you want add-only behavior
} = InvoiceSlice.actions;




export default InvoiceSlice.reducer;
export const selectAllInvoices = (state) => state.invoices;
