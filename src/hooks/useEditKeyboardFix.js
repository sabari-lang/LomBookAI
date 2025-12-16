import { useEffect } from "react";

// Updated to remove refreshKeyboard() calls that cause window blinking and input freeze
export const useEditKeyboardFix = (isEditing, inputRef) => {
    // Removed Electron IPC refreshKeyboard call - it caused window blinking and input freeze
    
    // Direct focus to specific input (if ref provided)
    useEffect(() => {
        if (!isEditing || !inputRef?.current) return;

        const t = setTimeout(() => {
            if (inputRef.current && typeof inputRef.current.focus === "function") {
                inputRef.current.focus();
            }
        }, 160);

        return () => clearTimeout(t);
    }, [isEditing, inputRef]);
};

