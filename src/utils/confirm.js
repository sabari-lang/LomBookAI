/**
 * Confirm dialog helper
 * Returns a Promise<boolean>
 * Usage: const confirmed = await confirm('Are you sure?');
 */

let confirmContext = null;

export const setConfirmContext = (context) => {
    confirmContext = context;
};

export const confirm = async (message, title = 'Confirm') => {
    if (confirmContext) {
        return await confirmContext.confirm(message, title);
    } else {
        console.warn('ConfirmDialogProvider not mounted. Message:', message);
        // Return false instead of blocking dialog
        return false;
    }
};

