/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        dominant: { DEFAULT: '#FFF8F0', dark: '#1A1612' },
        secondary: { DEFAULT: '#F5EDE0', dark: '#2C2420' },
        accent: { DEFAULT: '#F97316', dark: '#FB923C' },
        destructive: { DEFAULT: '#DC2626', dark: '#EF4444' },
        success: { DEFAULT: '#16A34A', dark: '#22C55E' },
        'text-primary': { DEFAULT: '#1A1612', dark: '#FAF5F0' },
        'text-secondary': { DEFAULT: '#78716C', dark: '#A8A29E' },
        border: { DEFAULT: '#E7D9C8', dark: '#3D3530' },
        sandbox: { DEFAULT: '#CA8A04', dark: '#EAB308' },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
