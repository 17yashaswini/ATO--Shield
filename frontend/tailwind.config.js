/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0e14',
          900: '#0f141c',
          850: '#141a24',
          800: '#1a212c',
          700: '#242c3a',
          600: '#323c4d',
        },
        accent: {
          400: '#3fd0c9',
          500: '#22b8b0',
          600: '#189189',
        },
        risk: {
          low: '#3fd0c9',
          medium: '#e8a13d',
          high: '#e5484d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
