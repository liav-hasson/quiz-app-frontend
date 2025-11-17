/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
<<<<<<< HEAD
      colors: {
        // Neon Vibrant Palette
        'neon-pink': '#f72585',
        'raspberry-plum': '#b5179e',
        'indigo-bloom': '#7209b7',
        'ultrasonic': '#560bad',
        'true-azure': '#480ca8',
        'vivid-royal': '#3a0ca3',
        'verdigris': '#159f91',
        'turquoise': '#1bccba',
        'turquoise-bright': '#1ee3cf',
        'soft-cyan': '#92f2e8',
        
        // Dark backgrounds
        'dark-bg': '#0a0e27',
        'dark-card': '#1a1f3a',
        
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
=======
>>>>>>> 24d7d98 (theme changes)
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
