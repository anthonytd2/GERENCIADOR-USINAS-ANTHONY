/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 1. A MARCA (Azul)
        brand: {
          dark: '#0B1E3F',   // Azul Profundo (Cabeçalhos)
          DEFAULT: '#1e40af', // Azul Padrão (Botões, Destaques)
          light: '#3b82f6',   // Azul Claro (Ícones, Hover)
        },

        // 2. O TEMA (Fundo e Texto) - AQUI ESTÁ O SEGREDO
        // Se quiser voltar para o claro, troque essas cores aqui
        fundo: {
            DEFAULT: '#0f172a', // Fundo Principal (Slate-900) - Escuro
            card: '#1e293b',    // Fundo dos Cards (Slate-800) - Um pouco mais claro
            hover: '#334155',   // Fundo ao passar o mouse (Slate-700)
        },
        texto: {
            DEFAULT: '#f8fafc', // Texto Principal (Slate-50) - Quase branco
            secundario: '#94a3b8', // Texto Secundário (Slate-400) - Cinza claro
            invertido: '#0f172a',  // Texto para fundos claros (Botões brancos)
        },
        borda: {
            DEFAULT: '#334155', // Cor das bordas (Slate-700) - Sutis
        }
      },
      // Animações que você já usa
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