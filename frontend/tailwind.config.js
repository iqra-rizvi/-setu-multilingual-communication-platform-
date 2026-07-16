/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1220',
        surface: '#131B2E',
        'surface-alt': '#1A2540',
        'surface-hover': '#202D4D',
        border: 'rgba(255,255,255,0.08)',
        text: '#EDF1F9',
        'text-dim': '#8D96AC',
        signal: '#FFA94D',
        teal: '#2DD4BF',
        violet: '#9B8CFF',
        danger: '#FB7185',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
