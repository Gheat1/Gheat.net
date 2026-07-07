/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'w95-face': '#c0c0c0',
        'w95-teal': '#008080',
        'w95-navy': '#000080',
      },
      fontFamily: {
        w95: ['Tahoma', '"MS Sans Serif"', '"Segoe UI"', 'sans-serif'],
        term: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
};
