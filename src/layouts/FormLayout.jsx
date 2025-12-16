import React from "react";

/**
 * FormLayout - Simple wrapper component for form pages
 * Note: Keyboard refresh is handled by useUnlockInputs hook in individual forms
 * Do not add global refreshKeyboard() here to prevent unnecessary window blinks
 */
const FormLayout = ({ children }) => {
  return <>{children}</>;
};

export default FormLayout;
