/**
 * Shared utility to reliably close Bootstrap modals across all Logistics modules.
 * 
 * Usage:
 *   import { closeModal, cleanupModalBackdrop } from '../utils/closeModal';
 *   closeModal('myModalId');
 * 
 * This handles:
 * - Bootstrap 5 Modal.getOrCreateInstance
 * - jQuery fallback
 * - Manual cleanup of leftover backdrop
 * - Safe cleanup for stacked modals
 */

/**
 * Check if any Bootstrap modal is currently visible
 * @returns {boolean} True if any modal is showing
 */
export const hasVisibleModal = () => {
    const visibleModals = document.querySelectorAll('.modal.show');
    return visibleModals.length > 0;
};

/**
 * Count the number of visible Bootstrap modals
 * @returns {number} Number of visible modals
 */
export const countVisibleModals = () => {
    return document.querySelectorAll('.modal.show').length;
};

/**
 * Safely close a Bootstrap modal by ID
 * @param {string} modalId - The ID of the modal element (without #)
 */
export const closeModal = (modalId) => {
    if (!modalId) return;

    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    try {
        // Method 1: Bootstrap 5 API - getOrCreateInstance ensures we have an instance
        const bootstrap = window.bootstrap;
        if (bootstrap?.Modal) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
                // Cleanup after modal is hidden - only if no other modals are visible
                setTimeout(() => safeCleanupBackdrop(), 350);
                return;
            }
        }
    } catch (e) {
        console.warn('Bootstrap 5 modal close failed:', e);
    }

    try {
        // Method 2: jQuery/Bootstrap 4 fallback
        if (window.$ && window.$(modalElement).modal) {
            window.$(modalElement).modal('hide');
            setTimeout(() => safeCleanupBackdrop(), 350);
            return;
        }
    } catch (e) {
        console.warn('jQuery modal close failed:', e);
    }

    // Method 3: Manual fallback - trigger close button
    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"], [data-dismiss="modal"]');
    if (closeBtn) {
        closeBtn.click();
        setTimeout(() => safeCleanupBackdrop(), 350);
        return;
    }

    // Method 4: Force cleanup
    forceCloseModal(modalElement);
};

/**
 * Safe cleanup - only removes backdrop and body classes if no modals are visible
 * This prevents breaking stacked modals
 */
export const safeCleanupBackdrop = () => {
    // Only cleanup if no modals are currently visible
    if (hasVisibleModal()) {
        return;
    }

    // Remove all backdrop elements
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
};

/**
 * Force cleanup of all backdrops and body classes
 * Use with caution - this will break stacked modals
 */
export const cleanupModalBackdrop = () => {
    // Remove all backdrop elements
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());

    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
};

/**
 * Force close a modal by directly manipulating its attributes
 * @param {HTMLElement} modalElement - The modal DOM element
 */
export const forceCloseModal = (modalElement) => {
    if (!modalElement) return;

    // Hide the modal
    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');
    modalElement.style.display = 'none';

    // Safe cleanup - respects stacked modals
    setTimeout(() => safeCleanupBackdrop(), 100);
};

/**
 * Close all visible modals - use sparingly
 */
export const closeAllModals = () => {
    const visibleModals = document.querySelectorAll('.modal.show');
    visibleModals.forEach(modal => {
        try {
            const bootstrap = window.bootstrap;
            if (bootstrap?.Modal) {
                const instance = bootstrap.Modal.getInstance(modal);
                if (instance) {
                    instance.hide();
                    return;
                }
            }
        } catch (e) {
            // Fallback to manual close
        }
        modal.classList.remove('show');
        modal.style.display = 'none';
    });

    // Force cleanup after closing all
    setTimeout(() => cleanupModalBackdrop(), 350);
};

/**
 * Close a react-new-window popup by calling window.close on it
 * @param {Window} popupWindow - Reference to the popup window
 */
export const closePopupWindow = (popupWindow) => {
    if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
    }
};

export default closeModal;
