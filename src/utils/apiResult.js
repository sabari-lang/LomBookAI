// src/utils/apiResult.js

/**
 * Unwraps ApiResult<T> response from backend
 * Handles both axios responses and plain ApiResult objects
 * @param {any} raw - The raw response from axios or ApiResult object
 * @returns {any} - The unwrapped data, or null if success is false
 * @throws {Error} - If success is false, throws an error with the message
 */
export const unwrapResult = (raw) => {
    if (!raw) return null;

    // Handle both axios responses and plain ApiResult
    const payload = raw.data ?? raw;

    // If it's an ApiResult wrapper with success field
    if (typeof payload === "object" && "success" in payload) {
        if (payload.success === false) {
            throw new Error(payload.message || "Operation failed");
        }
        return payload.data ?? payload;
    }

    // If it's already the data itself
    return payload;
};

/**
 * Unwraps ApiResult<PagedResult<T>> response from backend
 * Returns an object with items array and pagination metadata
 * @param {any} raw - The raw response from axios or ApiResult object
 * @returns {{items: Array, totalPages: number, totalCount: number, page: number, pageSize: number}} - Unwrapped paged result
 */
export const unwrapPaged = (raw) => {
    const result = unwrapResult(raw);

    // Handle PagedResult structure
    if (result && typeof result === "object") {
        return {
            items: result.items ?? [],
            totalPages: result.totalPages ?? 1,
            totalCount: result.totalCount ?? 0,
            page: result.page ?? 1,
            pageSize: result.pageSize ?? 10,
            ...result, // Include any other pagination fields
        };
    }

    // Fallback if result is not in expected format
    return {
        items: Array.isArray(result) ? result : [],
        totalPages: 1,
        totalCount: Array.isArray(result) ? result.length : 0,
        page: 1,
        pageSize: 10,
    };
};

