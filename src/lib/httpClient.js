

import axios from "axios";
import { clearAuth } from "../utils/auth";

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

// --- JWT Auth Helpers ---

// Prefer sessionStorage, fallback to localStorage
const getToken = () => sessionStorage.getItem("token") || localStorage.getItem("token");

// Guard to prevent multiple redirects on concurrent 401s
let isRedirectingToRoot = false;

const onUnauthorized = () => {
    if (isRedirectingToRoot) return;
    isRedirectingToRoot = true;
    clearAuth();
    // Use HashRouter-safe redirect to root
    window.location.hash = "#/";
};

// Attach Authorization header with Bearer token for all requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

logisticsApi.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Request interceptor for error normalization (optional - can be extended for auth/tenant headers)

// Response interceptors: normalize errors and handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) onUnauthorized();
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
        if (error?.response?.status === 401) onUnauthorized();
        if (error.response?.data) {
            const data = error.response.data;
            if (data.success === false && data.message) {
                error.message = data.message;
            }
        }
        return Promise.reject(error);
    }
);

