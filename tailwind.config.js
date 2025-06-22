/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}", "./*.{html,js,jsx}"],
  theme: {
    extend: {
      spacing: {
        '112': '28rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      minWidth: {
        '280': '280px',
        '320': '320px',
        '400': '400px',
        '500': '500px',
      },
      maxWidth: {
        '400': '400px',
        '500': '500px',
      }
    },
  },
  plugins: [],
} 