/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy - will be removed after migration
        'header-yellow': '#FBBF24',

        // Neutral System - Warm-tinted for professionalism
        neutral: {
          50: 'oklch(0.98 0.005 75)',
          100: 'oklch(0.96 0.008 75)',
          200: 'oklch(0.92 0.012 75)',
          300: 'oklch(0.86 0.018 75)',
          400: 'oklch(0.70 0.025 75)',
          500: 'oklch(0.55 0.030 75)',
          600: 'oklch(0.45 0.032 75)',
          700: 'oklch(0.35 0.030 75)',
          800: 'oklch(0.28 0.025 75)',
          900: 'oklch(0.22 0.020 75)',
          950: 'oklch(0.16 0.015 75)',
        },

        // Primary Accent - Vibrant Indigo
        primary: {
          50: 'oklch(0.96 0.040 260)',
          100: 'oklch(0.91 0.080 260)',
          200: 'oklch(0.82 0.130 260)',
          300: 'oklch(0.70 0.180 260)',
          400: 'oklch(0.58 0.240 260)',
          500: 'oklch(0.45 0.280 260)',
          600: 'oklch(0.35 0.260 260)',
          700: 'oklch(0.28 0.220 260)',
          800: 'oklch(0.22 0.180 260)',
          900: 'oklch(0.18 0.140 260)',
          950: 'oklch(0.13 0.100 260)',
        },

        // Secondary Accent - Vibrant Amber (matches logo)
        amber: {
          50: 'oklch(0.97 0.060 85)',
          100: 'oklch(0.92 0.120 85)',
          200: 'oklch(0.85 0.180 85)',
          300: 'oklch(0.75 0.240 85)',
          400: 'oklch(0.62 0.280 85)',
          500: 'oklch(0.50 0.300 85)',
          600: 'oklch(0.40 0.280 85)',
          700: 'oklch(0.32 0.240 85)',
          800: 'oklch(0.26 0.200 85)',
          900: 'oklch(0.21 0.160 85)',
          950: 'oklch(0.16 0.120 85)',
        },

        // Semantic - Success (vibrant indigo - same as primary)
        success: {
          50: 'oklch(0.96 0.040 260)',
          100: 'oklch(0.91 0.080 260)',
          200: 'oklch(0.82 0.130 260)',
          300: 'oklch(0.70 0.180 260)',
          400: 'oklch(0.58 0.240 260)',
          500: 'oklch(0.45 0.280 260)',
          600: 'oklch(0.35 0.260 260)',
          700: 'oklch(0.28 0.220 260)',
          800: 'oklch(0.22 0.180 260)',
          900: 'oklch(0.18 0.140 260)',
          950: 'oklch(0.13 0.100 260)',
        },

        // Semantic - Warning (vibrant orange)
        warning: {
          50: 'oklch(0.97 0.080 60)',
          100: 'oklch(0.92 0.140 60)',
          200: 'oklch(0.85 0.200 60)',
          300: 'oklch(0.75 0.250 60)',
          400: 'oklch(0.62 0.290 60)',
          500: 'oklch(0.50 0.320 60)',
          600: 'oklch(0.40 0.290 60)',
          700: 'oklch(0.32 0.250 60)',
          800: 'oklch(0.26 0.200 60)',
          900: 'oklch(0.21 0.150 60)',
          950: 'oklch(0.16 0.100 60)',
        },

        // Semantic - Error (vibrant rose/red)
        error: {
          50: 'oklch(0.97 0.080 25)',
          100: 'oklch(0.92 0.150 25)',
          200: 'oklch(0.85 0.220 25)',
          300: 'oklch(0.75 0.280 25)',
          400: 'oklch(0.62 0.330 25)',
          500: 'oklch(0.50 0.360 25)',
          600: 'oklch(0.40 0.330 25)',
          700: 'oklch(0.32 0.280 25)',
          800: 'oklch(0.26 0.220 25)',
          900: 'oklch(0.21 0.160 25)',
          950: 'oklch(0.16 0.100 25)',
        },

        // Semantic - Info (vibrant sky blue)
        info: {
          50: 'oklch(0.96 0.050 230)',
          100: 'oklch(0.91 0.100 230)',
          200: 'oklch(0.83 0.150 230)',
          300: 'oklch(0.72 0.200 230)',
          400: 'oklch(0.60 0.250 230)',
          500: 'oklch(0.50 0.280 230)',
          600: 'oklch(0.42 0.260 230)',
          700: 'oklch(0.35 0.220 230)',
          800: 'oklch(0.28 0.180 230)',
          900: 'oklch(0.23 0.140 230)',
          950: 'oklch(0.18 0.100 230)',
        },

        // Chart Colors (vibrant coordinated palette)
        chart: {
          1: 'oklch(0.45 0.280 260)', // primary indigo
          2: 'oklch(0.50 0.300 85)',  // amber
          3: 'oklch(0.45 0.280 260)', // success indigo
          4: 'oklch(0.50 0.360 25)',  // error rose
          5: 'oklch(0.50 0.280 230)', // info sky
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 oklch(0.22 0.020 75 / 0.05), 0 1px 4px 0 oklch(0.22 0.020 75 / 0.03)',
        'card': '0 1px 3px 0 oklch(0.22 0.020 75 / 0.08), 0 4px 12px 0 oklch(0.22 0.020 75 / 0.04)',
        'elevated': '0 4px 6px -1px oklch(0.22 0.020 75 / 0.10), 0 8px 24px -4px oklch(0.22 0.020 75 / 0.08)',
      },
    },
  },
  plugins: [],
}