/**
 * Input Safety Guard for Keyboard Event Listeners
 *
 * This utility prevents global keyboard shortcuts from interfering with text input.
 * When users are typing in input fields, textareas, or contenteditable elements,
 * shortcuts should not trigger to avoid losing typed content or freezing the input.
 *
 * Usage:
 *   window.addEventListener("keydown", (e) => {
 *     if (isUserTyping(e)) return;  // Skip if typing in input
 *     // ... your shortcut logic here
 *   });
 */

/**
 * Check if the user is currently typing in an editable element
 * @param {KeyboardEvent} event - The keyboard event to check
 * @returns {boolean} - True if user is typing in an input/textarea/contenteditable
 */
export const isUserTyping = (event) => {
  const tag = event?.target?.tagName?.toLowerCase?.();
  const isEditable = event?.target?.isContentEditable ?? false;

  // Allow normal typing in input fields, textareas, and contenteditable divs
  return tag === "input" || tag === "textarea" || isEditable;
};

/**
 * Wrap a keyboard event handler with input safety guard
 * Returns early if user is typing, allowing normal input behavior
 *
 * @param {Function} handler - Your shortcut handler function
 * @returns {Function} - Wrapped handler that checks isUserTyping first
 */
export const withInputSafetyGuard = (handler) => {
  return (event) => {
    if (isUserTyping(event)) {
      return; // Skip handler if typing
    }
    return handler(event);
  };
};
