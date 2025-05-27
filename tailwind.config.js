// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // 기존 primary 색상
        secondary: '#6366f1', // 기존 secondary 색상
      },
      borderRadius: { // 기존 borderRadius 설정
        'none': '0px',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
        'button': '8px', // 추가된 button borderRadius
      },
      fontFamily: {
        pacifico: ['Pacifico', 'cursive'], // 로고용 Pacifico 폰트
        inter: ['Inter', 'sans-serif'], // 기본 Inter 폰트 (globals.css에서 설정)
      },
      // 기존 HTML의 alert-animation keyframes 등은 globals.css로 이동
    },
  },
  plugins: [],
};