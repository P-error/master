/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // если используешь App Router:
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
  // Если у тебя много динамических классов, временно помоги safelist:
  safelist: [
    { pattern: /^(bg|text|border)-(red|green|blue|yellow|purple|pink|gray)-(100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^(p|px|py|m|mx|my)-(0|1|2|3|4|5|6|8|10|12|16)$/ },
    { pattern: /^(grid-cols|col-span)-(1|2|3|4|5|6|12)$/ },
    { pattern: /^(flex|items-center|justify-between|gap-\d+)$/ },
  ],
};
