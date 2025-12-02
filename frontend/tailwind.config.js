/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        // Force Tailwind emerald → use theme accent
        emerald: {
          50: "var(--primary-50)",
          100: "var(--primary-50)",
          200: "var(--primary-50)",
          300: "var(--primary-50)",
          400: "var(--primary-600)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent)",
          800: "var(--accent)",
          900: "var(--accent)",
        },

        // Force Tailwind teal → use theme accent
        teal: {
          50: "var(--primary-50)",
          100: "var(--primary-50)",
          200: "var(--primary-50)",
          300: "var(--primary-50)",
          400: "var(--primary-600)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent)",
          800: "var(--accent)",
          900: "var(--accent)",
        },

        // Force Tailwind green → use theme accent
        green: {
          50: "var(--primary-50)",
          100: "var(--primary-50)",
          200: "var(--primary-50)",
          300: "var(--primary-50)",
          400: "var(--primary-600)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent)",
          800: "var(--accent)",
          900: "var(--accent)",
        },
      },
    },
  },
  plugins: [],
}
