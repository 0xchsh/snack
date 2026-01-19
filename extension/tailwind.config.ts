import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        // Snack brand colors - monochromatic grayscale matching the product
        snack: {
          primary: '#e5e5e5', // Light gray for primary buttons (dark mode)
          'primary-hover': '#d4d4d4',
          'primary-active': '#a3a3a3',
          'primary-foreground': '#171717', // Dark text on light buttons
          bg: '#171717', // Dark background
          'bg-elevated': '#262626',
          border: '#404040',
          text: '#fafafa',
          'text-muted': '#a3a3a3',
        },
        // Twitter theme matching
        twitter: {
          bg: 'rgb(0, 0, 0)',
          'bg-hover': 'rgb(22, 24, 28)',
          border: 'rgb(47, 51, 54)',
          text: 'rgb(231, 233, 234)',
          'text-muted': 'rgb(113, 118, 123)',
          blue: 'rgb(29, 155, 240)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'twitter-sm': '13px',
        'twitter-base': '15px',
      },
      borderRadius: {
        twitter: '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'check-pop': 'checkPop 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
