import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';

export default function ProtectedRoute() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se existe uma sessão ativa no Supabase
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta mudanças na autenticação (ex: se o usuário deslogar)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não tem sessão, manda para o login. Se tem, libera o acesso (Outlet)
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}