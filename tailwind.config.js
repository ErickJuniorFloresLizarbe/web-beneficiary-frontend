/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilita el modo oscuro con la clase 'dark'
  content: [
    './src/**/*.{html,ts,js,jsx,tsx}', // Escanea archivos HTML, TS, JS dentro de /src
    './public/**/*.html',              // Escanea archivos HTML en /public
    '*.{js,ts,jsx,tsx,mdx}',           // Archivos sueltos si los tienes en raíz
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          10: '#ffffff',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
