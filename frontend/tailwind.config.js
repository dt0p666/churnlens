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
        navy: {
          950: '#070B14', // deep space navy background
          900: '#0B1120', // card surface
          850: '#0E172B', // elevated surface
          800: '#15223C', // borders & lines
          700: '#1E3258', // interactive borders
        },
        cyanAccent: {
          DEFAULT: '#22D3EE',
          light: '#67E8F9',
          dark: '#0891B2',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
        violetAccent: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#6D28D9',
        },
        risk: {
          high: '#F43F5E',    // coral/red
          medium: '#F59E0B',  // amber
          low: '#10B981',     // emerald
        }
      },
      boxShadow: {
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'cyan-glow': '0 0 25px rgba(34, 211, 238, 0.2)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
