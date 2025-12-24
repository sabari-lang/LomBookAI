/**
 * Modal Manager - Single source of truth for Bootstrap modal operations
 * 
 * Provides:
 * - openModal(modalId) - Open a Bootstrap modal programmatically
 * - closeModal(modalId) - Close a Bootstrap modal and cleanup
 * - cleanupBackdrops() - Remove all leftover backdrops and restore body state
 * 
 * Handles:
 * - Bootstrap 5 Modal API
 * - jQuery fallback
 * - Stacked modals prevention
 * - Backdrop cleanup
 * - Body scroll lock restoration
 */

/**
 * Open a Bootstrap modal by ID
 * @param {string} modalId - The ID of the modal element (without #)
 */
export const openModal = (modalId) => {
    if (!modalId) {
        console.warn('[modalManager] openModal called without modalId');
        return;
    }

    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.warn(`[modalManager] Modal element not found: ${modalId}`);
        return;
    }

    // Cleanup any leftover backdrops before opening
    cleanupBackdrops();

    try {
        // Method 1: Bootstrap 5 API
        const bootstrap = window.bootstrap;
        if (bootstrap?.Modal) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            if (modalInstance) {
                modalInstance.show();
                return;
            }
        }
    } catch (e) {
        console.warn('[modalManager] Bootstrap 5 modal open failed:', e);
    }

    try {
        // Method 2: jQuery/Bootstrap 4 fallback
        if (window.$ && window.$(modalElement).modal) {
            window.$(modalElement).modal('show');
            return;
        }
    } catch (e) {
        console.warn('[modalManager] jQuery modal open failed:', e);
    }

    // Method 3: Manual fallback - add show class and display
    modalElement.classList.add('show');
    modalElement.style.display = 'block';
    modalElement.setAttribute('aria-hidden', 'false');
    modalElement.setAttribute('aria-modal', 'true');
    modalElement.setAttribute('role', 'dialog');
    
    // Add backdrop manually if needed
    if (!document.querySelector('.modal-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
    
    document.body.classList.add('modal-open');
};

/**
 * Close a Bootstrap modal by ID
 * @param {string} modalId - The ID of the modal element (without #)
 */
export const closeModal = (modalId) => {
    if (!modalId) {
        console.warn('[modalManager] closeModal called without modalId');
        return;
    }

    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
        console.warn(`[modalManager] Modal element not found: ${modalId}`);
        return;
    }

    try {
        // Method 1: Bootstrap 5 API
        const bootstrap = window.bootstrap;
        if (bootstrap?.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
                // Cleanup after modal is hidden
                setTimeout(() => cleanupBackdrops(), 350);
                return;
            }
        }
    } catch (e) {
        console.warn('[modalManager] Bootstrap 5 modal close failed:', e);
    }

    try {
        // Method 2: jQuery/Bootstrap 4 fallback
        if (window.$ && window.$(modalElement).modal) {
            window.$(modalElement).modal('hide');
            setTimeout(() => cleanupBackdrops(), 350);
            return;
        }
    } catch (e) {
        console.warn('[modalManager] jQuery modal close failed:', e);
    }

    // Method 3: Manual fallback - trigger close button
    const closeBtn = modalElement.querySelector('[data-bs-dismiss="modal"], [data-dismiss="modal"]');
    if (closeBtn) {
        closeBtn.click();
        setTimeout(() => cleanupBackdrops(), 350);
        return;
    }

    // Method 4: Force close
    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');
    modalElement.style.display = 'none';
    
    setTimeout(() => cleanupBackdrops(), 100);
};

/**
 * Cleanup all leftover modal backdrops and restore body state
 * This should be called after closing modals to prevent stacked backdrops
 */
export const cleanupBackdrops = () => {
    // Remove all backdrop elements
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        try {
            backdrop.remove();
        } catch (e) {
            console.warn('[modalManager] Failed to remove backdrop:', e);
        }
    });

    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Restore body padding if it was changed
    const bodyPadding = document.body.style.paddingRight;
    if (bodyPadding) {
        document.body.style.paddingRight = '';
    }
    
    // Restore body overflow
    document.body.style.overflow = '';
};

/**
 * Check if any modal is currently visible
 * @returns {boolean} True if any modal is showing
 */
export const hasVisibleModal = () => {
    const visibleModals = document.querySelectorAll('.modal.show');
    return visibleModals.length > 0;
};

export default { openModal, closeModal, cleanupBackdrops, hasVisibleModal };

