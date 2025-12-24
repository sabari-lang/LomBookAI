const normalizeTerm = (term) => {
    if (!term) return "";
    return term.toString().trim().toUpperCase().replace(/[^A-Z]/g, "");
};

const isEmpty = (val) => val === undefined || val === null || val === "";

export const applyJobDefaults = (values = {}) => {
    const next = { ...values };

    if (isEmpty(next.declaredCarriage)) next.declaredCarriage = "N.V.D";
    if (isEmpty(next.declaredCustoms)) next.declaredCustoms = "NVC";
    if (isEmpty(next.insurance)) next.insurance = "NIL";
    if (isEmpty(next.kgLb)) next.kgLb = "KG";
    if (isEmpty(next.rateClass)) next.rateClass = "Q";

    return next;
};

export const applyShipmentTermPaymentLogic = (values = {}) => {
    const next = { ...values };

    const rawTerm =
        next.shipment ||
        next.shippingTerm ||
        next.incoterm ||
        next.incoterms ||
        next.freightTerm;

    const term = normalizeTerm(rawTerm);

    const prepaidTerms = new Set([
        "CIF",
        "CAF",
        "CFR",
        "CPT",
        "DAP",
        "DDP",
        "DDU",
        "C&F",
        "CANDF",
        "CF", // covers C & F after normalization
    ]);

    const collectTerms = new Set(["EXW", "FAS", "FCA", "FOB"]);

    const hasPaymentFields =
        Object.prototype.hasOwnProperty.call(next, "wtvalPP") ||
        Object.prototype.hasOwnProperty.call(next, "coll1") ||
        Object.prototype.hasOwnProperty.call(next, "otherPP") ||
        Object.prototype.hasOwnProperty.call(next, "coll2");

    if (!term || !hasPaymentFields) {
        return next;
    }

    const devWarn = (expectedWtVal, expectedOther) => {
        if (process.env.NODE_ENV === "production") return;
        const mismatched =
            (expectedWtVal && next.wtvalPP !== expectedWtVal) ||
            (expectedOther && next.otherPP !== expectedOther);
        if (mismatched) {
            // eslint-disable-next-line no-console
            console.warn("[JobDefaults] Shipment term payment mismatch", {
                term: rawTerm,
                normalizedTerm: term,
                wtvalPP: next.wtvalPP,
                coll1: next.coll1,
                otherPP: next.otherPP,
                coll2: next.coll2,
                expectedWtVal,
                expectedOther,
            });
        }
    };

    if (prepaidTerms.has(term)) {
        next.wtvalPP = "P";
        next.otherPP = "P";
        if (Object.prototype.hasOwnProperty.call(next, "coll1")) next.coll1 = "";
        if (Object.prototype.hasOwnProperty.call(next, "coll2")) next.coll2 = "";
        devWarn("P", "P");
        return next;
    }

    if (collectTerms.has(term)) {
        if (Object.prototype.hasOwnProperty.call(next, "wtvalPP")) next.wtvalPP = "";
        if (Object.prototype.hasOwnProperty.call(next, "otherPP")) next.otherPP = "";
        next.coll1 = "C";
        next.coll2 = "C";
        devWarn("", "");
        return next;
    }

    return next;
};

export const normalizeJobDates = (values = {}) => {
    const next = { ...values };
    Object.keys(next).forEach((key) => {
        if (!/date/i.test(key)) return;
        const val = next[key];
        if (val === undefined || val === null || val === "") {
            next[key] = null;
            return;
        }
        if (val instanceof Date && !Number.isNaN(val.getTime())) {
            next[key] = val.toISOString();
            return;
        }
        if (typeof val === "string") {
            const trimmed = val.trim();
            if (!trimmed) {
                next[key] = null;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                next[key] = trimmed;
            } else {
                const parsed = new Date(trimmed);
                next[key] = Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
            }
        }
    });
    return next;
};

