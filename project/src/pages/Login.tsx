import { useState } from 'react';
// 🟢 AQUI: O nome deve ser exatamente como está no seu arquivo lib
import { supabaseClient } from '../lib/supabaseClient'; 
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 🟢 AQUI: Use o nome correto da variável importada
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      toast.error('Erro no login: ' + error.message);
    } else {
      toast.success('Login realizado! Token gerado.');
      console.log('Token de acesso:', data.session?.access_token);
      window.location.href = '/'; // Redireciona para o Dashboard
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bionova</h2>
          <p className="text-gray-500 mt-2">Gestão de Usinas Solares</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              placeholder="exemplo@bionova.com" 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={senha} onChange={e => setSenha(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-8 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? 'Validando acesso...' : 'Entrar no Sistema'}
        </button>
      </form>
    </div>
  );
}