import { notifyError } from './notifications';

/**
 * Handle provisional entry errors and show user-friendly messages
 * Replaces alert() calls with non-blocking notifications
 */
export const handleProvisionalError = (error, customMessage = null) => {
    if (customMessage) {
        notifyError(customMessage);
        return;
    }

    if (!error) {
        notifyError("Unknown error occurred.");
        return;
    }

    // Network error
    if (!error.response) {
        notifyError("Unable to reach the server. Please check your internet connection.");
        return;
    }

    const status = error.response?.status;
    const data = error.response?.data;

    // 400 Bad Request
    if (status === 400) {
        if (data?.errors && Array.isArray(data.errors)) {
            const msgs = data.errors
                .filter((e) => e?.message)
                .map((e) => e.message);
            if (msgs.length > 0) {
                notifyError(msgs.join(", "));
                return;
            }
        }

        if (data?.error && Array.isArray(data.error)) {
            const msgs = data.error
                .filter((e) => typeof e === 'string')
                .map((e) => e);
            if (msgs.length > 0) {
                notifyError(msgs.join(", "));
                return;
            }
        }

        if (data?.message) {
            notifyError(data.message);
            return;
        }

        if (data?.error) {
            notifyError(data.error);
            return;
        }
    }

    // 401 Unauthorized
    if (status === 401) {
        notifyError("Unauthorized. Please log in again.");
        return;
    }

    // 403 Forbidden
    if (status === 403) {
        notifyError("You don't have permission to perform this action.");
        return;
    }

    // 404 Not Found
    if (status === 404) {
        notifyError("Resource not found.");
        return;
    }

    // 500 Server Error
    if (status >= 500) {
        notifyError("Server error. Please try again later.");
        return;
    }

    // Generic error message
    const message = data?.message || data?.error || error.message || "Unknown error occurred.";
    notifyError(message);
};
