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
    // CHAMA A ROTA OTIMIZADA DO BACKEND
    api.get('/dashboard/stats')
      .then((data: any) => {
        setStats({
          totalConsumidores: data.totalConsumidores || 0,
          totalUsinas: data.totalUsinas || 0,
          totalVinculos: data.totalVinculos || 0
        });
      })
      .catch((err: any) => {
        console.error("Erro ao carregar stats do dashboard:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500 text-center">Carregando painel...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0B1E3F] mb-6">Visão Geral</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD CONSUMIDORES */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Consumidores</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalConsumidores}</p>
          </div>
        </div>

        {/* CARD USINAS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Usinas Geradoras</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsinas}</p>
          </div>
        </div>

        {/* CARD VÍNCULOS ATIVOS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Contratos Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVinculos}</p>
          </div>
        </div>

      </div>

      <div className="mt-8 bg-gradient-to-r from-[#0B1E3F] to-[#1e40af] rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Gestão Solar Locações</h2>
        <p className="text-blue-100 max-w-2xl">
          Use o menu lateral para gerenciar seus consumidores, usinas e lançar os fechamentos mensais dos contratos de locação.
        </p>
      </div>
    </div>
  );
}