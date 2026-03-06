/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'poker-green': '#0e4a36',
        'poker-table': '#135c45',
        'poker-blue': '#1a3b5d',
      },
      backgroundImage: {
        'felt-pattern': "url('https://www.transparenttextures.com/patterns/felt.png')", // 使用在线纹理或纯色
      }
    },
  },
  plugins: [],
}
