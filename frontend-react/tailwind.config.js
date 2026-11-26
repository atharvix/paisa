/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          900: '#2E060F',
          800: '#3D0A16',
          700: '#4A0E1C', // primary brand deep burgundy
          600: '#661427',
          500: '#8A1B35',
          100: '#FBECEF',
          50: '#FDF7F8',
        },
        gold: {
          600: '#B89225',
          500: '#D4AF37', // warm gold accent
          400: '#E5C453',
          300: '#F2D978',
          100: '#FBF5DC',
          50: '#FDFBF2',
        },
        surface: {
          dark: '#0B0F17',
          card: '#131A26',
          border: '#222E40',
          muted: '#8B9BB4',
          ivory: '#F9FAFB',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
