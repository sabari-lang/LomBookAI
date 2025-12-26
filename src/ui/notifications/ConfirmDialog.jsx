import React, { createContext, useContext, useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

const ConfirmDialogContext = createContext(null);

export const useConfirm = () => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }
    return context;
};

export const ConfirmDialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState({
        open: false,
        title: 'Confirm',
        message: 'Are you sure?',
        onConfirm: null,
        onCancel: null,
    });

    const confirm = useCallback((message, title = 'Confirm') => {
        return new Promise((resolve) => {
            setDialog({
                open: true,
                title,
                message,
                onConfirm: () => {
                    setDialog((prev) => ({ ...prev, open: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setDialog((prev) => ({ ...prev, open: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    const handleClose = useCallback(() => {
        if (dialog.onCancel) {
            dialog.onCancel();
        }
    }, [dialog]);

    const handleConfirm = useCallback(() => {
        if (dialog.onConfirm) {
            dialog.onConfirm();
        }
    }, [dialog]);

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            <Dialog
                open={dialog.open}
                onClose={handleClose}
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
            >
                <DialogTitle id="confirm-dialog-title">
                    {dialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="confirm-dialog-description">
                        {dialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} color="primary" variant="contained" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </ConfirmDialogContext.Provider>
    );
};














