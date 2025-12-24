/**
 * Notification helpers
 * These functions can be used anywhere in the app
 * They require NotificationProvider to be mounted in the app tree
 */

let notificationContext = null;

export const setNotificationContext = (context) => {
    notificationContext = context;
};

export const notifySuccess = (message) => {
    if (notificationContext) {
        notificationContext.notifySuccess(message);
    } else {
        console.warn('NotificationProvider not mounted. Message:', message);
    }
};

export const notifyError = (message) => {
    if (notificationContext) {
        notificationContext.notifyError(message);
    } else {
        console.warn('NotificationProvider not mounted. Message:', message);
    }
};

export const notifyInfo = (message) => {
    if (notificationContext) {
        notificationContext.notifyInfo(message);
    } else {
        console.warn('NotificationProvider not mounted. Message:', message);
    }
};

export const notifyWarning = (message) => {
    if (notificationContext) {
        notificationContext.notifyWarning(message);
    } else {
        console.warn('NotificationProvider not mounted. Message:', message);
    }
};











