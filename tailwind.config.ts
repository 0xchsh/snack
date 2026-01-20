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
        'logo-marketing': '2rem', // 32px - marketing logo size
        'icon-button': '2.25rem', // 36px - icon button size
        'icon-button-mobile': '2.75rem', // 44px - mobile touch target (Apple/Google guideline)
        'container-app': '64rem', // 1024px - max-width for app content
        'container-marketing': '80rem', // 1280px - max-width for marketing
      },
      height: {
        'logo-app': '2rem', // 32px
        'logo-marketing': '2rem', // 32px
        'icon-button': '2.25rem', // 36px
        'icon-button-mobile': '2.75rem', // 44px - mobile touch target
      },
      minWidth: {
        'touch-target': '2.75rem', // 44px - minimum touch target
      },
      minHeight: {
        'touch-target': '2.75rem', // 44px - minimum touch target
      },
      maxWidth: {
        'container-app': '64rem', // 1024px - max-width for app content
        'container-marketing': '80rem', // 1280px - max-width for marketing
      },
      gap: {
        'nav': '0.5rem', // 8px - gap between nav items
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
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          active: "var(--secondary-active)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          hover: "var(--destructive-hover)",
          active: "var(--destructive-active)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          hover: "var(--muted-hover)",
          active: "var(--muted-active)",
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
        xs: "2px",
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
