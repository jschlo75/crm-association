import type { Config } from "tailwindcss";

// Palette basée sur le vert du logo SNHF (#67aa40)
const snhfGreen = {
  50:  "#f2faf0",
  100: "#e4f4d8",
  200: "#c5e8a8",
  300: "#a3d478",
  400: "#82bf50",
  500: "#67aa40",
  600: "#508f2c",
  700: "#3d7022",
  800: "#2c5018",
  900: "#1c3410",
  950: "#0e1d08",
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remplace le bleu par le vert SNHF pour toute l'application
        blue: snhfGreen,
        primary: snhfGreen,
      },
    },
  },
  plugins: [],
};

export default config;
