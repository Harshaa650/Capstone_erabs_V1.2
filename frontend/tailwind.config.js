export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'system-ui'],
        sans: ['"Plus Jakarta Sans"', 'system-ui'],
        body: ['"DM Sans"', 'system-ui'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      colors: {
        ink: { 900: '#0a0b14', 800: '#0a0e1a', 700: '#111827', 600: '#1a2332' },
        brand: {
          50: '#e8f0ff',
          100: '#d0e0ff',
          200: '#a0c4ff',
          300: '#6fa8ff',
          400: '#3b8dff',
          500: '#0b69ff',
          600: '#094fd1',
          700: '#0738a3',
          800: '#052574',
          900: '#031446',
        },
        accent: { DEFAULT: '#7cf7c6', pink: '#ff6ad5', amber: '#ffb547', cyan: '#5ee7ff' },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(124,247,198,.45)',
        'glow-blue': '0 0 40px -10px rgba(11,105,255,.45)',
        'glow-lg': '0 0 60px -10px rgba(11,105,255,.35)',
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
