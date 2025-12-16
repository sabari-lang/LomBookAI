export const MOBILE_REQUIRED = {
  required: "Mobile number is required",
  pattern: {
    value: /^[0-9]{10}$/,
    message: "Enter valid 10-digit mobile number",
  },
};

export const MOBILE_OPTIONAL = {
  validate: (v) => !v || /^[0-9]{10}$/.test(v) || "Enter valid 10-digit mobile number",
};

export const onlyDigits = (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
};
