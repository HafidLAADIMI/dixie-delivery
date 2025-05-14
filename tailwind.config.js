/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./sections/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}" // Include root files like App.js
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}