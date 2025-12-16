export const handleProvisionalError = (error, action = "Operation", customMessage = null) => {
    console.error(`${action} Error:`, error);

    // If custom message provided, use it
    if (customMessage && typeof customMessage === "string") {
        alert(customMessage);
        return;
    }

    let message = `${action} failed. Please try again.`;

    try {
        // ------------------------
        // 1️⃣ Network / No Response
        // ------------------------
        if (!error?.response) {
            alert("Unable to reach the server. Please check your internet connection.");
            return;
        }

        const data = error?.response?.data ?? {};         // safe fallback
        const status = error?.response?.status ?? null;   // safe fallback


        // ------------------------
        // 2️⃣ ModelState Validation
        //    { errors: { field: ["msg"] } }
        // ------------------------
        if (data?.errors && typeof data.errors === "object") {
            const rawValues = Object.values(data.errors);

            const msgs = Array.isArray(rawValues)
                ? rawValues.flat().filter(v => typeof v === "string" && v.trim())
                : [];

            if (msgs.length > 0) {
                alert(msgs.join(", "));
                return;
            }
        }


        // ------------------------
        // 3️⃣ Array Errors
        //    error: ["msg1", "msg2"]
        // ------------------------
        if (Array.isArray(data?.error)) {
            const msgs = data.error
                .filter(v => typeof v === "string" && v.trim());

            if (msgs.length > 0) {
                alert(msgs.join(", "));
                return;
            }
        }


        // ------------------------
        // 4️⃣ Direct message from backend
        // ------------------------
        if (typeof data?.message === "string" && data.message.trim()) {
            alert(data.message);
            return;
        }


        // ------------------------
        // 5️⃣ Direct error string
        // ------------------------
        if (typeof data?.error === "string" && data.error.trim()) {
            alert(data.error);
            return;
        }


        // ------------------------
        // 6️⃣ Status Code Fallbacks
        // ------------------------
        const statusMap = {
            400: "Bad Request. Please verify the input data.",
            401: "Unauthorized. Please login again.",
            403: "Forbidden. You do not have permission.",
            404: "Resource not found.",
            408: "Request timeout. Please try again.",
            409: "Conflict. Duplicate or invalid data.",
            422: "Unprocessable request. Check the input values.",
            500: "Server error. Please try again later.",
            503: "Service unavailable. Try again shortly.",
        };

        if (status && statusMap[status]) {
            message = statusMap[status];
        } else {
            message = `Unexpected error (${status || "Unknown"}).`;
        }

    } catch (handlerError) {
        // ------------------------
        // 7️⃣ Safe Fallback for Handler Crash
        // ------------------------
        console.error("Error inside error handler:", handlerError);
        message = "An unexpected error occurred.";
    }

    // ------------------------
    // 8️⃣ Final Universal Fallback
    // ------------------------
    alert(message || "Unknown error occurred.");
};
