import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    });

    const showNotification = useCallback((message, severity = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    }, []);

    const notifySuccess = useCallback((message) => {
        showNotification(message, 'success');
    }, [showNotification]);

    const notifyError = useCallback((message) => {
        showNotification(message, 'error');
    }, [showNotification]);

    const notifyInfo = useCallback((message) => {
        showNotification(message, 'info');
    }, [showNotification]);

    const notifyWarning = useCallback((message) => {
        showNotification(message, 'warning');
    }, [showNotification]);

    const handleClose = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifySuccess,
                notifyError,
                notifyInfo,
                notifyWarning,
            }}
        >
            {children}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};











