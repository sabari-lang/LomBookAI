import React, { useEffect } from "react";
import Navigation from "./components/common/navigation/Navigation";

const App = () => {

  useEffect(() => {
    if (!window.electronAPI?.onUpdateMessage) return;

    window.electronAPI.onUpdateMessage((message) => {
      console.log("Update message from main:", message);

      // For now, just show alert. Later you can replace with a toast/modal.
      alert(message);
    });
  }, []);

  return (
    <>
      <Navigation />
    </>
  );
};

export default App;
