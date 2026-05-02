import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nje: {
          DEFAULT: '#14532d',
          light: '#16a34a',
          dark: '#052e16',
        }
      }
    }
  },
  plugins: []
} satisfies Config
