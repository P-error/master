// tailwind.config.js
module.exports = {
  darkMode: "class", // ✅ переключение тем по классу "dark"
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // путь к файлам проекта
  ],
  theme: {
    extend: {
      fontSize: {
        sm: "0.875rem",  // ~14px
        base: "1rem",    // ~16px
        lg: "1.125rem",  // ~18px
        xl: "1.25rem",   // ~20px
      },
    },
  },
  plugins: [],
}
