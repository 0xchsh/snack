import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        'nav-x': '1.5rem', // 24px - horizontal nav padding
        'nav-y': '1.5rem', // 24px - vertical nav padding
        'nav-x-mobile': '1rem', // 16px - mobile horizontal padding
        'nav-y-mobile': '0.75rem', // 12px - mobile vertical padding
      },
      width: {
        'logo-app': '2rem', // 32px - app logo size
        'logo-marketing': '2.5rem', // 40px - marketing logo size
        'icon-button': '2.625rem', // 42px - icon button size
        'container-app': '64rem', // 1024px - max-width for app content
        'container-marketing': '80rem', // 1280px - max-width for marketing
      },
      height: {
        'logo-app': '2rem', // 32px
        'logo-marketing': '2.5rem', // 40px
        'icon-button': '2.625rem', // 42px
      },
      gap: {
        'nav': '0.75rem', // 12px - gap between nav items
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'sans-serif', 'system-ui'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
