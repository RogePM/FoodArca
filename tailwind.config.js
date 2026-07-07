/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        techCyan: 'hsl(var(--tech-cyan))',
        successGreen: 'hsl(var(--success-green))',
        electricBlue: 'hsl(var(--electric-blue))',
        
        // --- PROPERLY LINKED ARCA COLORS ---
        brand: {
          primary: 'hsl(var(--brand-primary))',
          light: 'hsl(var(--brand-light))',
        },
        hero: {
          main: 'hsl(var(--hero-text-main))',
          muted: 'hsl(var(--hero-text-muted))',
          border: 'hsl(var(--hero-border))',
          hover: 'hsl(var(--hero-hover))',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Fira Mono', 'Menlo', 'Monaco', 'monospace'],
        luxury: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        antonio: ['var(--font-antonio)', 'sans-serif'],
        inria: ['var(--font-inria-serif)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        inriaSerif: ['var(--font-inria-serif)', 'serif'],
      },
    },
  },
  plugins: [],
}
