/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float': 'float 20s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}