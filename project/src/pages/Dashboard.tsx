import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Zap, Link as LinkIcon } from 'lucide-react';
import Skeleton from '../components/Skeleton'; // Importamos o novo componente

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalConsumidores: 0,
    totalUsinas: 0,
    totalVinculos: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((data: any) => {
        setStats({
          totalConsumidores: data.totalConsumidores || 0,
          totalUsinas: data.totalUsinas || 0,
          totalVinculos: data.totalVinculos || 0
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Usando a nova cor padronizada: text-brand-dark */}
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Visão Geral</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardStat 
          titulo="Consumidores" 
          valor={stats.totalConsumidores} 
          icone={<Users className="w-6 h-6" />} 
          corBg="bg-blue-100" 
          corTexto="text-blue-700" 
          loading={loading}
        />
        <CardStat 
          titulo="Usinas Geradoras" 
          valor={stats.totalUsinas} 
          icone={<Zap className="w-6 h-6" />} 
          corBg="bg-amber-100" 
          corTexto="text-amber-700" 
          loading={loading}
        />
        <CardStat 
          titulo="Contratos Ativos" 
          valor={stats.totalVinculos} 
          icone={<LinkIcon className="w-6 h-6" />} 
          corBg="bg-green-100" 
          corTexto="text-green-700" 
          loading={loading}
        />
      </div>

      <div className="mt-8 bg-gradient-to-r from-brand-dark to-brand-DEFAULT rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Gestão Solar</h2>
        <p className="text-blue-100 max-w-2xl">
          Use o menu lateral para gerenciar seus consumidores, usinas e lançar os fechamentos mensais.
        </p>
      </div>
    </div>
  );
}

// Pequeno componente interno para limpar o código repetitivo
function CardStat({ titulo, valor, icone, corBg, corTexto, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-3 ${corBg} ${corTexto} rounded-lg`}>
        {icone}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{titulo}</p>
        {loading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{valor}</p>
        )}
      </div>
    </div>
  );
}