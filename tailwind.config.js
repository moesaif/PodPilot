/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0b0e',
        surface: '#111318',
        elevated: '#181b22',
        hover: '#1e2230',
        selected: '#1a2438',
        border: '#1e2230',
        accent: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        red: '#ef4444',
        orange: '#f97316',
        purple: '#a855f7',
        cyan: '#06b6d4',
        'text-primary': '#e2e8f0',
        'text-secondary': '#7c8db0',
        'text-muted': '#4a5568',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        xs: ['11px', { lineHeight: '1.5' }],
        sm: ['12px', { lineHeight: '1.5' }],
        base: ['13px', { lineHeight: '1.5' }],
        md: ['14px', { lineHeight: '1.5' }],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
