import { useEffect, useRef } from "react";

/**
 * useKeyboardSafety Hook
 * 
 * Safely blocks refresh keyboard shortcuts (F5, Ctrl+R, Cmd+R) without interfering
 * with normal typing in form inputs, textareas, or contenteditable elements.
 * 
 * Features:
 * - Never blocks typing in input, textarea, select, or contenteditable elements
 * - Intercepts only refresh keys: F5, Ctrl+R, Cmd+R
 * - Optional dirty state check (can show warning if form has unsaved changes)
 * - Optional callback when refresh is blocked (for toast/confirm dialogs)
 * - Proper cleanup on unmount
 * - Uses capture phase to intercept before other handlers
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.blockRefresh - Whether to block refresh shortcuts (default: true)
 * @param {boolean} options.isDirty - Optional: form has unsaved changes (for warnings)
 * @param {Function} options.onBlockedRefresh - Optional: callback when refresh is blocked
 * @returns {void}
 * 
 * @example
 * // Basic usage - block refresh
 * useKeyboardSafety({ blockRefresh: true });
 * 
 * @example
 * // With dirty state and warning
 * const isDirty = formState.isDirty;
 * useKeyboardSafety({
 *   blockRefresh: true,
 *   isDirty,
 *   onBlockedRefresh: () => {
 *     toast.warning("Please save your changes before refreshing");
 *   }
 * });
 */
export const useKeyboardSafety = ({
  blockRefresh = true,
  isDirty = false,
  onBlockedRefresh = null,
}) => {
  const handlerRef = useRef(null);
  const optionsRef = useRef({ blockRefresh, isDirty, onBlockedRefresh });

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = { blockRefresh, isDirty, onBlockedRefresh };
  }, [blockRefresh, isDirty, onBlockedRefresh]);

  useEffect(() => {
    if (!blockRefresh) {
      return;
    }

    // Create handler function
    handlerRef.current = (e) => {
      const { blockRefresh: shouldBlock, isDirty: formIsDirty, onBlockedRefresh: callback } = optionsRef.current;

      if (!shouldBlock) {
        return;
      }

      // Check if user is typing in a form control
      const target = e.target;
      const tagName = target?.tagName?.toLowerCase();
      const isContentEditable = target?.isContentEditable === true;

      // Allow typing in form controls - never block these
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        isContentEditable
      ) {
        return;
      }

      // Check for refresh keys
      const isF5 = e.key === "F5" || e.keyCode === 116;
      const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R");

      if (isF5 || isCtrlR) {
        // Prevent default refresh behavior
        e.preventDefault();
        e.stopPropagation();

        // Call optional callback
        if (callback && typeof callback === "function") {
          callback(formIsDirty);
        }

        return false;
      }
    };

    // Attach listener in capture phase to intercept before other handlers
    window.addEventListener("keydown", handlerRef.current, { capture: true });

    // Cleanup: remove listener on unmount
    return () => {
      if (handlerRef.current) {
        window.removeEventListener("keydown", handlerRef.current, { capture: true });
        handlerRef.current = null;
      }
    };
  }, [blockRefresh]); // Only re-run if blockRefresh changes

  // Return nothing (void hook)
  return;
};
