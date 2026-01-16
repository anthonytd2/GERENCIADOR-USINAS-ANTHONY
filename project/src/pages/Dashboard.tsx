// src/pages/Dashboard.tsx (Versão de Compatibilidade - Lenta)
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Zap, Link as LinkIcon } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalConsumidores: 0,
    totalUsinas: 0,
    totalVinculos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca tudo (método antigo) para contar no front
    Promise.all([
      api.consumidores.list().catch(() => []),
      api.usinas.list().catch(() => []),
      api.vinculos.list().catch(() => [])
    ]).then(([consumidores, usinas, vinculos]) => {
      // Verifica se é array ou objeto com .data (depende da sua API antiga)
      const nConsumidores = Array.isArray(consumidores) ? consumidores.length : (consumidores.data?.length || 0);
      const nUsinas = Array.isArray(usinas) ? usinas.length : (usinas.data?.length || 0);
      const nVinculos = Array.isArray(vinculos) ? vinculos.length : (vinculos.data?.length || 0);
      
      setStats({
        totalConsumidores: nConsumidores,
        totalUsinas: nUsinas,
        totalVinculos: nVinculos
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Carregando painel...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0B1E3F] mb-6">Visão Geral</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><Users className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Consumidores</p><p className="text-2xl font-bold text-gray-900">{stats.totalConsumidores}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg"><Zap className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Usinas Geradoras</p><p className="text-2xl font-bold text-gray-900">{stats.totalUsinas}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg"><LinkIcon className="w-6 h-6" /></div>
          <div><p className="text-sm text-gray-500 font-medium">Contratos Ativos</p><p className="text-2xl font-bold text-gray-900">{stats.totalVinculos}</p></div>
        </div>
      </div>
    </div>
  );
}