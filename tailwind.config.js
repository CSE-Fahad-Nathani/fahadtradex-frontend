/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: "#0B0F19",
        cardBg: "#111827",
        accent: "#00FFA3",
        profit: "#22C55E",
        loss: "#FF4D4F",
        borderColor: "#1F2937",
        textPrimary: "#F9FAFB",
      },
    },
  },
  plugins: [],
}

