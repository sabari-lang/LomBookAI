import React, { useEffect } from "react";
import Navigation from "./components/common/navigation/Navigation";
import { NotificationProvider, useNotification } from "./ui/notifications/NotificationProvider";
import { ConfirmDialogProvider, useConfirm } from "./ui/notifications/ConfirmDialog";
import { setNotificationContext } from "./utils/notifications";
import { setConfirmContext } from "./utils/confirm";

const AppContent = () => {
  const notification = useNotification();
  const confirmHook = useConfirm();

  useEffect(() => {
    // Set global notification context
    setNotificationContext(notification);
    setConfirmContext(confirmHook);
  }, [notification, confirmHook]);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateMessage) return;

    window.electronAPI.onUpdateMessage((message) => {
      console.log("Update message from main:", message);
      // Use non-blocking notification instead of alert
      notification.notifyInfo(message);
    });
  }, [notification]);

  return <Navigation />;
};

const App = () => {
  return (
    <NotificationProvider>
      <ConfirmDialogProvider>
        <AppContent />
      </ConfirmDialogProvider>
    </NotificationProvider>
  );
};

export default App;
