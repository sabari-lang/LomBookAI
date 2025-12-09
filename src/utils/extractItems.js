// src/utils/extractItems.js


export const extractItems = (raw) => {
    if (!raw) return [];

    // Direct array
    if (Array.isArray(raw)) return raw;

    // 1️⃣ Direct level (safe both sides)
    if (Array.isArray(raw?.items)) return raw?.items;
    if (Array.isArray(raw?.data)) return raw?.data;
    if (Array.isArray(raw?.results)) return raw?.results;
    if (Array.isArray(raw?.rows)) return raw?.rows;
    if (Array.isArray(raw?.list)) return raw?.list;
    if (Array.isArray(raw?.records)) return raw?.records;
    if (Array.isArray(raw?.content)) return raw?.content;

    // 2️⃣ Nested level (safe both sides)
    if (Array.isArray(raw?.data?.items)) return raw?.data?.items;
    if (Array.isArray(raw?.data?.results)) return raw?.data?.results;
    if (Array.isArray(raw?.data?.rows)) return raw?.data?.rows;
    if (Array.isArray(raw?.data?.list)) return raw?.data?.list;
    if (Array.isArray(raw?.data?.records)) return raw?.data?.records;
    if (Array.isArray(raw?.data?.content)) return raw?.data?.content;

    // 3️⃣ Deep nested (safe both sides)
    if (Array.isArray(raw?.data?.data?.items)) return raw?.data?.data?.items;
    if (Array.isArray(raw?.data?.data?.results)) return raw?.data?.data?.results;
    if (Array.isArray(raw?.data?.data?.rows)) return raw?.data?.data?.rows;
    if (Array.isArray(raw?.data?.data?.list)) return raw?.data?.data?.list;
    if (Array.isArray(raw?.data?.data?.records)) return raw?.data?.data?.records;
    if (Array.isArray(raw?.data?.data?.content)) return raw?.data?.data?.content;

    // 4️⃣ Single object fallback
    if (typeof raw === "object" && Object.keys(raw).length > 0) return [raw];

    return [];
};
