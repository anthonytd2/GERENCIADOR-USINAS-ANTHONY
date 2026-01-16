/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AQUI ESTÁ A MÁGICA: Definimos a cor oficial da empresa
        brand: {
          dark: '#0B1E3F',   // Aquele azul escuro elegante
          DEFAULT: '#1e40af', // Azul padrão
          light: '#3b82f6',   // Azul claro para detalhes
        }
      }
    },
  },
  plugins: [],
}