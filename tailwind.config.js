/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: "var(--color-primary-bg)",
        cardBg: "var(--color-card-bg)",
        accent: "var(--color-accent)",
        profit: "#22C55E",
        loss: "#FF4D4F",
        borderColor: "var(--color-border)",
        textPrimary: "var(--color-text-primary)",
        textMuted: "var(--color-text-muted)",
        textSubtle: "var(--color-text-subtle)",
        inputBg: "var(--color-input-bg)",
      },
    },
  },
  plugins: [],
}

