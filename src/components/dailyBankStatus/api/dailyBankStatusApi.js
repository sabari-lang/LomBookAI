/**
 * Daily Bank Status API wrapper
 * TODO: adjust endpoints when backend specifics are available
 */
import { api } from "../../../lib/httpClient";
import { toApiYYYYMMDD } from "../utils/dateFormat";

export const getBankAccounts = async ({ type }) => {
    // GET /api/daily-bank-status/accounts?type=INR
    const response = await api.get("/api/daily-bank-status/accounts", {
        params: { type: type || "INR" },
    });
    return response.data;
};

export const getDailyBankStatus = async ({ type, date }) => {
    const response = await api.get("/api/daily-bank-status", {
        params: {
            type: type || "INR",
            date: toApiYYYYMMDD(date),
        },
    });
    return response.data;
};

export const saveDailyBankStatus = async ({ type, date, items }) => {
    const payload = {
        type: type || "INR",
        date: toApiYYYYMMDD(date),
        items: items || [],
    };
    const response = await api.post("/api/daily-bank-status/save", payload);
    return response.data;
};

export const generateStatusReport = async ({ date }) => {
    const response = await api.get("/api/daily-bank-status/report", {
        params: { date: toApiYYYYMMDD(date) },
    });
    return response.data;
};

export const getStatusReportPdfUrl = ({ date }) => {
    // Return a PDF URL string; backend endpoint may differ
    const apiDate = toApiYYYYMMDD(date);
    return `/api/daily-bank-status/report/pdf?date=${apiDate}`;
};

export const listDeposits = async ({ page = 1, pageSize = 10, search = "" }) => {
    const response = await api.get("/api/daily-bank-status/deposits", {
        params: { page, pageSize, search },
    });
    return response.data;
};

export const createDeposit = async (payload) => {
    const response = await api.post("/api/daily-bank-status/deposits", payload);
    return response.data;
};

export const updateDeposit = async (id, payload) => {
    const response = await api.put(`/api/daily-bank-status/deposits/${id}`, payload);
    return response.data;
};

export const deleteDeposit = async (id) => {
    const response = await api.delete(`/api/daily-bank-status/deposits/${id}`);
    return response.data;
};

