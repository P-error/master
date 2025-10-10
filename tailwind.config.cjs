/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}', // если App Router не используешь, пусть всё равно будет
  ],
  theme: { extend: {} },
  plugins: [],
  // временно подстрахуемся на проде
  safelist: [
    { pattern: /^(container|prose)$/ },
    { pattern: /^(flex|grid|items-center|justify-between|gap-\d+)$/ },
    { pattern: /^(p|px|py|m|mx|my)-(0|1|2|3|4|5|6|8|10|12|16)$/ },
    { pattern: /^(rounded|rounded-(sm|md|lg|xl|2xl))$/ },
    { pattern: /^(text|bg|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(100|200|300|400|500|600|700|800|900)$/ },
  ],
};
