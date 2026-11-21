/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep forest pine green requested by user (#113C2E / #0C4032 / #19392C)
        emerald: {
          50: '#edf7f4',
          100: '#d5eee5',
          200: '#aedecd',
          300: '#7ec6ae',
          400: '#4da68c',
          500: '#2d876e',
          600: '#1c6a54',
          700: '#154e3d',
          800: '#113c2e', // User's exact swatch color
          900: '#0c4032', // User's dark gradient shade
          950: '#07241c', // Deepest forest green
        },
        agri: {
          50: '#edf7f4',
          100: '#d5eee5',
          200: '#aedecd',
          300: '#7ec6ae',
          400: '#4da68c',
          500: '#2d876e',
          600: '#1c6a54',
          700: '#154e3d',
          800: '#113c2e',
          900: '#0c4032',
        },
        earth: {
          50: '#fdf8f4',
          100: '#f7ede2',
          200: '#edd8c3',
          300: '#dfbc9b',
          400: '#ce9c72',
          500: '#bf8052',
          600: '#b06c44',
          700: '#925338',
          800: '#774332',
          900: '#62382c',
        }
      }
    },
  },
  plugins: [],
}

