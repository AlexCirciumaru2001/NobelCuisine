/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4ade80', // Light green
          DEFAULT: '#22c55e', // Medium green
          dark: '#16a34a', // Dark green
        },
        background: '#f8fafc', // Very light gray/white
      },
    },
  },
  plugins: [],
};