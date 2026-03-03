import { useEffect, useCallback } from 'react';
import { supabaseClient } from '../lib/supabaseClient'; // Verifique se o caminho está correto
import toast from 'react-hot-toast';

// Limite de 15 minutos (900.000 milissegundos)
const INACTIVITY_LIMIT = 15 * 60 * 1000; 

export const useAutoLogout = () => {
  const logout = useCallback(async () => {
    try {
      // 1. Encerra a sessão no Supabase
      await supabaseClient.auth.signOut();
      
      // 2. Avisa o usuário de forma amigável
      toast.error('Sessão encerrada por inatividade para sua segurança.', {
        duration: 6000,
        position: 'top-center',
      });

      // 3. Redireciona para o login e limpa o estado do navegador
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao realizar logout automático:', error);
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(logout, INACTIVITY_LIMIT);
    };

    // Eventos de interação que reiniciam o contador
    const events = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    // Adiciona os ouvintes de evento
    events.forEach(event => 
      window.addEventListener(event, resetTimer)
    );

    // Inicia o timer inicial
    resetTimer();

    // Limpeza de memória ao desmontar o sistema
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => 
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [logout]);
};