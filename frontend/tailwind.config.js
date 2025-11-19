/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#013048',
          dark: '#001f2e',
          light: '#024563',
        },
        accent: {
          DEFAULT: '#fbb03c',
          dark: '#e09a1f',
          light: '#fcc066',
        },
      },
    },
  },
  plugins: [],
}
