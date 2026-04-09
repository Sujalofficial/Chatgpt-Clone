/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gpt: {
          bg:       '#212121',   /* main background */
          sidebar:  '#171717',   /* sidebar background */
          surface:  '#2f2f2f',   /* input / surface */
          hover:    '#2a2a2a',   /* sidebar item hover */
          active:   '#343434',   /* sidebar item active */
          msg:      '#2f2f2f',   /* AI message strip bg */
          border:   '#3e3e3e',   /* borders */
          text:     '#ececf1',   /* primary text */
          muted:    '#8e8ea0',   /* secondary text */
          green:    '#10a37f',   /* brand accent */
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Söhne Mono"', 'ui-monospace', '"Cascadia Code"', 'monospace'],
      },
      maxWidth: { 'chat': '48rem' }, /* 768px message width */
    },
  },
  plugins: [],
};
