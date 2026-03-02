/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2B7FBF',
        'primary-light': '#EBF4FB',
        'accent-green': '#27AE60',
        'accent-orange': '#F4A261',
        'warning-red': '#E63946',
        'bg': '#FAFFFE',
        'surface': '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#5A6A7A',
        'border': '#D0E8F2',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '26px', fontWeight: '400' }],
        'label': ['16px', { lineHeight: '22px', fontWeight: '500' }],
        'helper': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'nav': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        '18': '72px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};
