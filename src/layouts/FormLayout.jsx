import React, { useEffect } from "react";
import { refreshKeyboard } from "../utils/refreshKeyboard";

const FormLayout = ({ children }) => {
  useEffect(() => {
    refreshKeyboard();
  }, []);

  return <>{children}</>;
};

export default FormLayout;
