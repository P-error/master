/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // через CSS-переменные — удобно синхронизировать темы
        bg: "hsl(var(--bg))",
        fg: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        card: "hsl(var(--card))",
        primary: "hsl(var(--primary))",
        primaryFg: "hsl(var(--primary-fg))",
        secondary: "hsl(var(--secondary))",
        secondaryFg: "hsl(var(--secondary-fg))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(0,0,0,.08), 0 8px 24px -12px rgba(0,0,0,.12)",
        glass: "0 1px 0 0 rgba(255,255,255,.08) inset, 0 8px 24px -12px rgba(0,0,0,.25)",
        ring: "0 0 0 2px hsl(var(--ring) / 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "emphasized": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
  // подстраховка на проде
  safelist: [
    { pattern: /^(container|prose)$/ },
    { pattern: /^(flex|grid|items-center|justify-between|justify-center|gap-\d+)$/ },
    { pattern: /^(p|px|py|m|mx|my)-(0|1|2|3|4|5|6|8|10|12|16)$/ },
    { pattern: /^(rounded|rounded-(sm|md|lg|xl|2xl|3xl))$/ },
    { pattern: /^(text|bg|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(100|200|300|400|500|600|700|800|900)$/ },
  ],
};
