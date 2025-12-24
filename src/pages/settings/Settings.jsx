import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshKeyboard } from '../../utils/refreshKeyboard';
import { notifySuccess } from '../../utils/notifications';

const STABILITY_MODES = {
    A: {
        value: 'A',
        label: 'Default',
        description: 'disable-renderer-backgrounding + backgroundThrottling: false',
    },
    B: {
        value: 'B',
        label: 'Occlusion Mitigation (Windows)',
        description: 'Mode A + disable-features=CalculateNativeWinOcclusion',
    },
    C: {
        value: 'C',
        label: 'Disable Hardware Acceleration',
        description: 'Mode A + app.disableHardwareAcceleration()',
    },
};

const Settings = () => {
    const navigate = useNavigate();
    const [currentMode, setCurrentMode] = useState('A');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showRestartPrompt, setShowRestartPrompt] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Load current stability mode on mount
    useEffect(() => {
        const loadMode = async () => {
            try {
                if (window?.electronAPI?.getStabilityMode) {
                    const result = await window.electronAPI.getStabilityMode();
                    if (result && result.mode) {
                        setCurrentMode(result.mode);
                    }
                }
            } catch (e) {
                console.error('Failed to load stability mode:', e);
            } finally {
                setLoading(false);
            }
        };

        loadMode();
    }, []);

    const handleModeChange = async (newMode) => {
        if (newMode === currentMode) {
            return; // No change
        }

        setSaving(true);
        setSaveError(null);

        try {
            if (window?.electronAPI?.setStabilityMode) {
                const result = await window.electronAPI.setStabilityMode(newMode);
                if (result && result.success) {
                    setCurrentMode(newMode);
                    setShowRestartPrompt(true);
                } else {
                    setSaveError(result?.error || 'Failed to save stability mode');
                }
            } else {
                setSaveError('Electron API not available');
            }
        } catch (e) {
            console.error('Failed to set stability mode:', e);
            setSaveError(e.message || 'Failed to save stability mode');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    Settings
                </h4>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                </button>
            </div>

            {/* Stability Mode Section */}
            <div className="card shadow-sm">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-cpu me-2"></i>
                        Stability Mode
                    </h5>
                    <small className="text-muted">
                        Compatibility profiles for keyboard input stability (Electron 38.2.2)
                    </small>
                </div>
                <div className="card-body">
                    {saveError && (
                        <div className="alert alert-danger" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {saveError}
                        </div>
                    )}

                    {showRestartPrompt && (
                        <div className="alert alert-warning alert-dismissible fade show" role="alert">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Restart Required:</strong> Stability mode has been changed. Please restart the application for changes to take effect.
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowRestartPrompt(false)}
                                aria-label="Close"
                            ></button>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Current Mode: <span className="badge bg-primary">{currentMode}</span></label>
                        <p className="text-muted small mb-3">
                            Select a compatibility profile to improve keyboard input stability, especially when other apps like Chrome are running.
                        </p>
                    </div>

                    <div className="row g-3">
                        {Object.values(STABILITY_MODES).map((mode) => (
                            <div key={mode.value} className="col-md-4">
                                <div
                                    className={`card h-100 ${currentMode === mode.value ? 'border-primary shadow-sm' : ''}`}
                                    style={{
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        opacity: saving ? 0.6 : 1,
                                    }}
                                    onClick={() => !saving && handleModeChange(mode.value)}
                                >
                                    <div className="card-body">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="stabilityMode"
                                                id={`mode-${mode.value}`}
                                                checked={currentMode === mode.value}
                                                onChange={() => !saving && handleModeChange(mode.value)}
                                                disabled={saving}
                                            />
                                            <label
                                                className="form-check-label fw-semibold"
                                                htmlFor={`mode-${mode.value}`}
                                                style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
                                            >
                                                Mode {mode.value}: {mode.label}
                                            </label>
                                        </div>
                                        <p className="text-muted small mt-2 mb-0">
                                            {mode.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {saving && (
                        <div className="mt-3 text-center">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span className="visually-hidden">Saving...</span>
                            </div>
                            <span className="text-muted">Saving...</span>
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-light rounded">
                        <h6 className="fw-semibold mb-2">
                            <i className="bi bi-info-circle me-2"></i>
                            About Stability Modes
                        </h6>
                        <ul className="mb-0 small">
                            <li>
                                <strong>Mode A (Default):</strong> Recommended for most users. Prevents renderer throttling when window is backgrounded.
                            </li>
                            <li>
                                <strong>Mode B:</strong> Adds Windows occlusion mitigation. Use if Mode A doesn't resolve input freezing issues.
                            </li>
                            <li>
                                <strong>Mode C:</strong> Disables hardware acceleration. Use as last resort if Modes A and B don't work. May impact performance.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Keyboard Refresh Section */}
            <div className="card shadow-sm mt-4">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="bi bi-keyboard me-2"></i>
                        Keyboard Input
                    </h5>
                    <small className="text-muted">
                        Emergency fallback if keyboard input freezes
                    </small>
                </div>
                <div className="card-body">
                    <p className="text-muted small mb-3">
                        If keyboard input freezes in forms, use this button to refresh window focus.
                        This causes a brief window blink but can unlock frozen inputs.
                    </p>
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={async () => {
                            try {
                                await refreshKeyboard({ force: true });
                                notifySuccess('Keyboard refresh triggered');
                            } catch (e) {
                                console.error('Keyboard refresh failed:', e);
                            }
                        }}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Fix Keyboard Input
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;


