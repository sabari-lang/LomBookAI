import { useEffect, useRef } from "react";
import { refreshKeyboard } from "../utils/refreshKeyboard";

/**
 * useUnlockInputs Hook
 * 
 * Fixes: Frozen keyboard input when editing records in Electron forms
 * Solution: Triggers one-time keyboard refresh on edit mode entry
 * 
 * Production optimizations:
 * - Runs only ONCE per edit session (prevents multiple blinks)
 * - 50ms delay ensures form DOM is fully mounted
 * - Resets when exiting edit mode for next edit
 * - Safe for web browsers (refreshKeyboard has fallback)
 * 
 * Usage:
 *   const isEditing = Boolean(state?.id);
 *   useUnlockInputs(isEditing);
 * 
 * @param {boolean} isEditing - True when editing existing record, false for new
 */
export const useUnlockInputs = (isEditing) => {
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      // Reset flag when exiting edit mode (back to list or creating new)
      hasRefreshed.current = false;
      return;
    }

    // Only refresh keyboard ONCE when entering edit mode
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      
      // Delay ensures form is fully mounted before blur/focus
      setTimeout(() => {
        refreshKeyboard();
      }, 50);
    }
  }, [isEditing]);
};

