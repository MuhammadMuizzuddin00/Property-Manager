/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f7f5",
          100: "#e6ede9",
          500: "#3f6b52",
          600: "#33553f",
          700: "#294432",
        },
        // Rent collected / positive status
        teal: {
          50: "#e1f5ee",
          200: "#9fe1cb",
          600: "#0f6e56",
          800: "#085041",
          900: "#04342c",
        },
        // Overdue / attention
        coral: {
          50: "#faece7",
          200: "#f0997b",
          600: "#993c1d",
          800: "#712b13",
          900: "#4a1b0c",
        },
        // Occupancy / informational
        sky: {
          50: "#e6f1fb",
          200: "#85b7eb",
          600: "#185fa5",
          800: "#0c447c",
          900: "#042c53",
        },
        // Vacant unit / neutral warm accent
        sand: {
          50: "#f3e7d6",
          600: "#854f0b",
        },
      },
      fontFamily: {
        // Editorial serif for page titles and headline numbers — pairs with
        // the default sans (Inter, via Next.js) used everywhere else.
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
