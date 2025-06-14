/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#000000", // Saf siyah
        surface: "#111111", // Hafif koyu kartlar için
        primary: "#f5f5f5", // Beyaz yazı
        secondary: "#d4d4d4", // Hafif kırık beyaz
        accent: "#3b82f6", // Mavi vurgu rengi (butonlar için)
        success: "#22c55e", // yeşil (başarılı)
        danger: "#ef4444", // kırmızı (hatalı)
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem", // kart ve butonlarda güzel yuvarlaklık
      },
    },
  },
  plugins: [],
};
