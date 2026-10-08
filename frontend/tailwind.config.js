/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        palette: {
          sage: '#CCD5AE',
          matcha: '#E9EDC9',
          cream: '#FEFAE0',
          sand: '#FAEDCD',
          caramel: '#D4A373',
        },
        navy: {
          950: '#FEFAE0', // main background canvas (Warm Cream)
          900: '#FAEDCD', // card surfaces (Warm Sand / Biscuit)
          850: '#F5E6BF', // elevated surface
          800: '#CCD5AE', // borders & divider lines (Sage)
          750: '#BFCB9D', // hover borders
          700: '#A4B081', // active borders
        },
        cyanAccent: {
          DEFAULT: '#D4A373', // Warm Caramel primary action accent
          light: '#DEB58D',
          dark: '#BA8957',
          glow: 'rgba(212, 163, 115, 0.25)',
        },
        slate: {
          50: '#0C0A09',
          100: '#1C1917', // Primary body & heading text (Deep Stone Charcoal)
          200: '#292524',
          300: '#44403C',
          400: '#57534E', // Muted labels
          500: '#78716C', // Secondary text
          600: '#A8A29E',
          700: '#CCD5AE',
          800: '#E9EDC9',
          900: '#FAEDCD',
          950: '#FEFAE0',
        },
        risk: {
          high: '#DC2626',    // Warm crimson
          medium: '#D97706',  // Warm amber
          low: '#15803D',     // Warm olive green
        }
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        'cyan-glow': '0 0 12px rgba(212, 163, 115, 0.2)',
        'card': '0 2px 8px rgba(44, 38, 25, 0.05)',
      }
    },
  },
  plugins: [],
}
