/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Map CSS variables to Tailwind utilities - Single Source of Truth
      colors: {
        // Accent colors
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-tertiary': 'var(--accent-tertiary)',
        'accent-quaternary': 'var(--accent-quaternary)',
        'accent-quinary': 'var(--accent-quinary)',
        
        // Backgrounds
        'bg-dark': 'var(--bg-dark)',
        'bg-card': 'var(--bg-card)',
        'bg-card-light': 'var(--bg-card-light)',
        
        // Text
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-secondary)',
        'text-highlight': 'var(--text-highlight)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-cool-warm': 'var(--gradient-cool-warm)',
        'gradient-neon-purple': 'var(--gradient-neon-purple)',
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float': 'float 20s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}