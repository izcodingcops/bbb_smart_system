/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'lato-light': ['Lato-Light'],
        'lato': ['Lato-Regular'],
        'lato-medium': ['Lato-Regular'],
        'lato-bold': ['Lato-Bold'],
        'lato-black': ['Lato-Black'],
      },
      colors: {
        primary: {
          DEFAULT: '#1D4889',
          light: '#2B5BAE',
          dark: '#152F5F',
        },
      },
    },
  },
  plugins: [],
};
