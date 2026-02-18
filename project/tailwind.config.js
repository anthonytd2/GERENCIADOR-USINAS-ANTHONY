/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Configuração da fonte Inter
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#0B1E3F',   
          DEFAULT: '#1e40af', 
          light: '#3b82f6',   
        },
        // Variáveis de tema (Dark Mode) - Estão aqui mas não atrapalham o Light Mode se não usar
        fundo: {
          DEFAULT: '#0f172a',
          card: '#1e293b',    
          hover: '#334155',   
        },
        texto: {
          DEFAULT: '#f8fafc', 
          secundario: '#94a3b8', 
          invertido: '#0f172a',  
        },
        borda: {
          DEFAULT: '#334155', 
        }
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.5s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}