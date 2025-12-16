// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };


module.exports = {
  prefix: "tw-",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        masterBlue: "#007bff",   // Master Air Waybill header
        houseTeal: "#0097A7"     // House Air Waybills header
      }
    },
  },
  plugins: [],
};
