/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#F2F7F4', 100: '#E1EEE6', 200: '#C3DCCD', 300: '#94C0A6', 500: '#3B8361', 600: '#2F6B4F', 700: '#245A42', 800: '#1F4D3A', 900: '#133024' },
        ink: { 50: '#F7F8F7', 100: '#EEF1EF', 200: '#DFE4E1', 300: '#C4CCC8', 400: '#8E9A94', 500: '#66736D', 600: '#4A5550', 700: '#333C38', 900: '#161C19' },
      },
      boxShadow: { soft: '0 1px 2px rgba(16,24,20,.04), 0 4px 16px rgba(16,24,20,.06)', lift: '0 12px 40px rgba(16,24,20,.12)' },
    },
  },
  plugins: [],
}
