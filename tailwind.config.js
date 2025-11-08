/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Neon color palette
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff00ff',
          green: '#00ff88',
          orange: '#ffaa00',
          purple: '#b000ff',
          blue: '#0088ff',
          pink: '#ff0080',
        },
        // Dark backgrounds
        dark: {
          base: '#0a0a0f',
          surface: '#12121a',
          elevated: '#1a1a27',
          border: '#2a2a3a',
          hover: '#1f1f2e',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)'
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(0, 240, 255, 0.8)'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-magenta': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'neon-purple': '0 0 20px rgba(176, 0, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 15px rgba(0, 240, 255, 0.3)',
      },
    },
  },
  plugins: [],
}

