/**
 * Date Formatting Utilities for Daily Bank Status
 * UI: DD-MM-YYYY
 * API: YYYY-MM-DD
 */

export const toUiDDMMYYYY = (date) => {
    if (!date) return "";
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return "";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        console.warn("[dateFormat] failed to format date", date, e);
        return "";
    }
};

export const toApiYYYYMMDD = (date) => {
    if (!date) return null;

    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
    }
    if (typeof date === "string" && /^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [dd, mm, yy] = date.split("-");
        return `${yy}-${mm}-${dd}`;
    }

    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return null;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.warn("[dateFormat] failed to convert date", date, e);
        return null;
    }
};

export const todayUi = () => toUiDDMMYYYY(new Date());

