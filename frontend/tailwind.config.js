/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile': '428px',   // iPhone Pro Max+
        'tablet': '768px',   // iPad+
        'desktop': '1024px', // Laptop+
      },
    },
  },
  plugins: [],
}