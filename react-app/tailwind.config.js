/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Old colors
        'lime-cream': '#E8F5C8',
        'yellow': '#FFC857',
        'graphite': '#2D2D2A',
        
        // New Modern Palette
        'silver': '#E8EAF6',
        'silver-light': '#F5F7FA',
        'cyan': '#00D9FF',
        'cyan-dark': '#00B8D9',
        'purple': '#7C3AED',
        'purple-dark': '#5B21B6',
        'purple-light': '#A78BFA',
        'indigo': '#4F46E5',
        'slate': '#1E293B',
        'slate-light': '#334155',
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float': 'float 20s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
