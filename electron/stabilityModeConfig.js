/**
 * Stability Mode Configuration
 * 
 * Manages compatibility mode profiles (A/B/C) with persistence.
 * Config source priority:
 * 1. userData file: <app.getPath('userData')>/stability-mode.json
 * 2. env var: LOM_STABILITY_MODE (A|B|C)
 * 3. argv: --stability-mode=A|B|C
 * 4. default: A
 */

const fs = require('fs');
const path = require('path');

const STABILITY_MODES = {
    A: 'A', // Default: disable-renderer-backgrounding + backgroundThrottling: false
    B: 'B', // Profile A + Windows occlusion mitigation
    C: 'C', // Profile A + disable hardware acceleration
};

const CONFIG_FILE_NAME = 'stability-mode.json';

/**
 * Get user data directory path
 * Must match the logic in main.js: app.setPath("userData", ...)
 */
const getUserDataPath = () => {
    try {
        const { app } = require('electron');
        const os = require('os');
        const path = require('path');
        
        // Use same logic as main.js
        const isDev = app && !app.isPackaged;
        const appName = isDev ? "lomBookDev" : "lomBook";
        
        // Try to get from app if ready, otherwise construct manually
        if (app && app.isReady()) {
            try {
                return app.getPath('userData');
            } catch (e) {
                // Fallback to manual construction
            }
        }
        
        // Manual construction (matches main.js logic)
        if (process.platform === 'win32') {
            return path.join(os.homedir(), 'AppData', 'Roaming', appName);
        } else if (process.platform === 'darwin') {
            return path.join(os.homedir(), 'Library', 'Application Support', appName);
        } else {
            return path.join(os.homedir(), '.config', appName);
        }
    } catch (e) {
        // Fallback if electron not available
        const os = require('os');
        const path = require('path');
        return path.join(os.homedir(), 'AppData', 'Roaming', 'lomBook');
    }
};

/**
 * Get config file path
 */
const getConfigFilePath = () => {
    return path.join(getUserDataPath(), CONFIG_FILE_NAME);
};

/**
 * Read stability mode from config file
 * Returns null if file doesn't exist or is invalid
 */
const readStabilityMode = () => {
    try {
        const configPath = getConfigFilePath();
        if (!fs.existsSync(configPath)) {
            return null;
        }

        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);

        if (config && typeof config.mode === 'string' && Object.values(STABILITY_MODES).includes(config.mode)) {
            return config.mode;
        }

        return null;
    } catch (e) {
        // File doesn't exist or invalid JSON - return null
        return null;
    }
};

/**
 * Write stability mode to config file
 */
const writeStabilityMode = (mode) => {
    try {
        if (!Object.values(STABILITY_MODES).includes(mode)) {
            throw new Error(`Invalid stability mode: ${mode}`);
        }

        const configPath = getConfigFilePath();
        const config = {
            mode: mode,
            updatedAt: new Date().toISOString(),
        };

        // Ensure directory exists
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Failed to write stability mode config:', e);
        return false;
    }
};

/**
 * Get stability mode from command line arguments
 * Checks for --stability-mode=A|B|C
 */
const getStabilityModeFromArgv = () => {
    for (let i = 0; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg === '--stability-mode' && i + 1 < process.argv.length) {
            const mode = process.argv[i + 1].toUpperCase();
            if (Object.values(STABILITY_MODES).includes(mode)) {
                return mode;
            }
        } else if (arg.startsWith('--stability-mode=')) {
            const mode = arg.split('=')[1]?.toUpperCase();
            if (mode && Object.values(STABILITY_MODES).includes(mode)) {
                return mode;
            }
        }
    }
    return null;
};

/**
 * Get stability mode with priority:
 * 1. userData file: <app.getPath('userData')>/stability-mode.json
 * 2. env var: LOM_STABILITY_MODE (A|B|C)
 * 3. argv: --stability-mode=A|B|C
 * 4. default: A
 * 
 * Can be called BEFORE app.whenReady() (for startup switches)
 */
const getStabilityMode = () => {
    // Priority 1: userData file (persisted setting)
    try {
        const persistedMode = readStabilityMode();
        if (persistedMode) {
            return persistedMode;
        }
    } catch (e) {
        // Failed to read - continue to next priority
    }

    // Priority 2: Environment variable (LOM_STABILITY_MODE)
    if (process.env.LOM_STABILITY_MODE) {
        const envMode = process.env.LOM_STABILITY_MODE.toUpperCase();
        if (Object.values(STABILITY_MODES).includes(envMode)) {
            return envMode;
        }
    }

    // Priority 3: Command line argument (--stability-mode=A|B|C)
    const argvMode = getStabilityModeFromArgv();
    if (argvMode) {
        return argvMode;
    }

    // Priority 4: Default
    return STABILITY_MODES.A;
};

/**
 * Get stability mode configuration (what switches/settings to apply)
 */
const getStabilityModeConfig = (mode) => {
    const effectiveMode = mode || getStabilityMode();

    const configs = {
        [STABILITY_MODES.A]: {
            disableRendererBackgrounding: true,
            backgroundThrottling: false,
            disableWinOcclusion: false,
            disableHardwareAcceleration: false,
        },
        [STABILITY_MODES.B]: {
            disableRendererBackgrounding: true,
            backgroundThrottling: false,
            disableWinOcclusion: true, // Windows occlusion mitigation
            disableHardwareAcceleration: false,
        },
        [STABILITY_MODES.C]: {
            disableRendererBackgrounding: true,
            backgroundThrottling: false,
            disableWinOcclusion: false,
            disableHardwareAcceleration: true, // GPU fallback
        },
    };

    return configs[effectiveMode] || configs[STABILITY_MODES.A];
};

module.exports = {
    STABILITY_MODES,
    getStabilityMode,
    getStabilityModeConfig,
    writeStabilityMode,
    readStabilityMode,
};











