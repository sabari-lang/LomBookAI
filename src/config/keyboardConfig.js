/**
 * Keyboard refresh feature flag configuration
 * 
 * Controls whether refreshKeyboard() is enabled for automatic edit-mode calls.
 * Default: false (disabled) - refreshKeyboard should only be used as manual fallback
 */

const getConfig = () => {
    // Check localStorage for runtime override
    const getLocalStorageFlag = (key, defaultValue) => {
        try {
            const stored = localStorage.getItem(`keyboardConfig.${key}`);
            if (stored !== null) {
                return stored === 'true';
            }
        } catch (e) {
            // localStorage may not be available
        }
        return defaultValue;
    };

    // Check environment variables for build-time config
    const getEnvFlag = (key, defaultValue) => {
        if (typeof process !== 'undefined' && process.env) {
            const envKey = `VITE_KEYBOARD_REFRESH_${key.toUpperCase()}`;
            const value = process.env[envKey];
            if (value !== undefined) {
                return value === 'true' || value === '1';
            }
        }
        return defaultValue;
    };

    // Priority: localStorage > env > default
    const getFlag = (key, defaultValue) => {
        const envValue = getEnvFlag(key, defaultValue);
        return getLocalStorageFlag(key, envValue);
    };

    return {
        // Enable automatic refreshKeyboard calls in edit mode
        // Default: false (disabled) - should only be used as manual fallback
        enableAutoRefresh: getFlag('enableAutoRefresh', false),
    };
};

export const keyboardConfig = getConfig();

/**
 * Update config at runtime (for testing/debugging)
 */
export const updateConfig = (updates) => {
    try {
        Object.entries(updates).forEach(([key, value]) => {
            localStorage.setItem(`keyboardConfig.${key}`, String(value));
        });
        // Reload config
        Object.assign(keyboardConfig, getConfig());
    } catch (e) {
        console.warn('[KeyboardConfig] Failed to update config:', e);
    }
};
