import axios from "axios";

const API_BASE = import.meta.env.VITE_API_LOCAL;
const LOGISTICS_BASE = import.meta.env.VITE_API_BASE_URL;

// Axios instance for accounting modules (items, sales, purchases, reports, banking)
export const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Axios instance for logistics modules
export const logisticsApi = axios.create({
    baseURL: LOGISTICS_BASE,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor for error normalization (optional - can be extended for auth/tenant headers)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Normalize error responses
        if (error.response?.data) {
            const data = error.response.data;
            if (data.success === false && data.message) {
                error.message = data.message;
            }
        }
        return Promise.reject(error);
    }
);

logisticsApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Normalize error responses
        if (error.response?.data) {
            const data = error.response.data;
            if (data.success === false && data.message) {
                error.message = data.message;
            }
        }
        return Promise.reject(error);
    }
);

