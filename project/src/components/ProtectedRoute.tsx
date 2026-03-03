import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabaseClient } from '../lib/supabaseClient';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      // 🛡️ Ação Crucial: getUser() valida o token no servidor do Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      
      if (user && !error) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Verificando segurança...</div>;
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;