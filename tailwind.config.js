/** @type {import('tailwindcss').Config} */
const themeContent = require('./src/theme');

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: themeContent.colors,
      spacing: themeContent.spacing,
    },
  },
  plugins: [],
}
