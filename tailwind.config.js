/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material Design 3 Color System
        'primary': '#6750A4',
        'primary-container': '#EADDFF',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#21005D',
        'secondary': '#625B71',
        'secondary-container': '#E8DEF8',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#1D192B',
        'tertiary': '#7D5260',
        'tertiary-container': '#FFD8E4',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#31111D',
        'error': '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error': '#FFFFFF',
        'on-error-container': '#410002',
        'background': '#FFFBFE',
        'on-background': '#1C1B1F',
        'surface': '#FFFBFE',
        'surface-container': '#F3EDF7',
        'surface-container-high': '#ECE6F0',
        'surface-container-highest': '#E6E0E9',
        'on-surface': '#1C1B1F',
        'on-surface-variant': '#49454F',
        'outline': '#79747E',
        'outline-variant': '#CAC4D0',
        'inverse-surface': '#313033',
        'inverse-on-surface': '#F4EFF4',
        'inverse-primary': '#D0BCFF',
        // Dark theme colors
        'primary-dark': '#D0BCFF',
        'primary-container-dark': '#4F378B',
        'on-primary-dark': '#21005D',
        'on-primary-container-dark': '#EADDFF',
        'secondary-dark': '#CCC2DC',
        'secondary-container-dark': '#4A4458',
        'on-secondary-dark': '#1D192B',
        'on-secondary-container-dark': '#E8DEF8',
        'background-dark': '#1C1B1F',
        'on-background-dark': '#E6E1E5',
        'surface-dark': '#1C1B1F',
        'surface-container-dark': '#211F26',
        'surface-container-high-dark': '#2B2930',
        'on-surface-dark': '#E6E1E5',
        'on-surface-variant-dark': '#CAC4D0',
        'outline-dark': '#938F99',
        'outline-variant-dark': '#49454F',
      },
      animation: {
        'ripple': 'ripple 0.6s linear',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
