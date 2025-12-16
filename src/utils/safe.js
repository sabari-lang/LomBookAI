// src/utils/safe.js

export const norm = (v) => (v ?? "").toString().trim().toLowerCase();

export const toNumberSafe = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const toBoolSafe = (v, def = false) => (v === undefined || v === null ? def : !!v);

export const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

export const getId = (obj) => obj?.id ?? obj?._id ?? obj?.customerId ?? obj?.contactId ?? obj?.vendorId ?? obj?.zohoId ?? null;
