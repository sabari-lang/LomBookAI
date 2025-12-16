// ============================================================================
// LEGACY FILE DOCUMENT API - DEPRECATED
// ============================================================================
// This file contains old SQL/MySQL-based API helpers that are NOT compatible
// with the current ASP.NET Core MongoDB backend.
//
// TODO: Either:
//   1. Remove this file if InvoiceAgent functionality is no longer needed, OR
//   2. Implement a new file/document API in the backend and refactor this file
//
// Current status: This file is kept for backward compatibility but may not work
// with the current backend architecture.
// ============================================================================

import { api } from "../../lib/httpClient";

// const BASE_URL = process.env.REACT_APP_BASE_URL;

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Helper function to handle SQL API responses
const handleSQLResponse = (response) => {
    return {
        ...response,
        source: "mysql",
        database_source: "mysql",
    };
};
// Helper function for error handling
const handleError = (error, operation) => {
    console.error(`Error in ${operation}:`, error);
    throw error;
};

// =========INVOICE AGENT APIs START==============


// api.js
// const API_BASE = import.meta.env.VITE_API_BASE || "";

async function http(method, url, body) {
    // Use api instance for all requests
    try {
        const res = await api({
            url,
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json, text/plain;q=0.9",
            },
            data: body ? JSON.stringify(body) : undefined,
        });
        return res.data;
    } catch (err) {
        const msg = err?.response?.data?.message || err.message || `HTTP ${err?.response?.status}`;
        throw new Error(msg);
    }
}

// 👇 Named exports
// export const createInvoice = (payload) => http("POST", "/api/Invoice", payload);
// INVOICE AGENT APIS
export const createInvoice = async (data) => {
    try {
        const response = await api.post(`${BASE_URL}/invoices`, data);
        return handleSQLResponse(response.data);
    } catch (error) {
        handleError(error, "createInvoice");
        return null;
    }
};

// GET ALL AGENT
export const getInvoices = async (params = {}) => {
    try {
        const response = await api.get(`${BASE_URL}/invoices`, {
            params,
        });
        return response?.data;
    } catch (error) {
        handleError(error, "getInvoices");
        return null;
    }
};

export const deleteInvoice = async (id) => {
    try {
        const response = await api.delete(`${BASE_URL}/invoices/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, "deleteInvoice");
        return null;
    }
};



export const getInvoiceById = (id) =>
    http("GET", `/api/invoices/${encodeURIComponent(id)}`);

const BASE_SINGLE_URL =
    "https://invoice-generator-101-gahjerfgddcefqf5.canadacentral-01.azurewebsites.net/api/invoices/download-single-excel";

export async function handleDownload(id) {
    if (!id) return;

    try {
        const res = await api.get(`${BASE_SINGLE_URL}/${id}`, {
            responseType: "arraybuffer",
            headers: {
                Accept:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream",
            },
            // withCredentials: true, // <- uncomment if your API needs cookies
        });

        // derive filename from Content-Disposition if present
        let filename = `invoice_${id}.xlsx`;
        const dispo = res.headers["content-disposition"];
        if (dispo) {
            const m = dispo.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
            if (m?.[1]) filename = decodeURIComponent(m[1]);
        }

        const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, filename);
    } catch (err) {
        // Try to decode error text if server returned JSON/text
        let msg = err?.message || "Download failed";
        try {
            const text = new TextDecoder().decode(err?.response?.data);
            const json = JSON.parse(text);
            msg = json.message || json.error || msg;
        } catch { }
        alert(msg);
        console.error(err);
    }
}

// ============INVOICE AGENT APIs END==============