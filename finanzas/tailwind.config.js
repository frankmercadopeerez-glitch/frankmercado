/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#060910", 800: "#0c1019", 700: "#131929" },
        gold: { 500: "#F5BC45" },
      },
      fontFamily: { sans: ["Poppins", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
