// src/utils/extractPagination.js

export const extractPagination = (raw = {}) => {
    if (!raw) return { totalPages: 1, totalCount: 0 };

    // Unified backend normalization
    const totalPages =
        raw.totalPages ??
        raw.data?.totalPages ??
        raw.meta?.totalPages ??
        raw.pagination?.totalPages ??
        null;

    const totalCount =
        raw.totalCount ??
        raw.data?.totalCount ??
        raw.meta?.totalCount ??
        raw.pagination?.totalCount ??
        raw.data?.items?.length ??
        raw.items?.length ??
        null;

    return {
        totalPages: totalPages ?? 1,
        totalCount: totalCount ?? 0,
    };
};
