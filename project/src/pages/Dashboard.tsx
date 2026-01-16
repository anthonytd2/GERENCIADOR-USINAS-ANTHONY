import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, Zap, Link as LinkIcon, TrendingUp } from 'lucide-react';
import Skeleton from '../components/Skeleton';

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
    <div className="space-y-8">
      <div>
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
      </div>

      {/* NOVO: GRÁFICO DE BARRAS CSS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Faturamento */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Faturamento Recente (Simulado)
            </h3>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">+12% vs mês anterior</span>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {[45, 60, 35, 70, 55, 80].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group">
                <div className="relative w-full bg-gray-100 rounded-t-lg h-full overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-brand-light group-hover:bg-brand-DEFAULT transition-all duration-500 rounded-t-lg"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Banner de Boas Vindas */}
        <div className="bg-gradient-to-br from-brand-dark to-brand-DEFAULT rounded-2xl p-8 text-white shadow-lg flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Gestão Solar</h2>
          <p className="text-blue-100 mb-6 leading-relaxed">
            Seu sistema está rodando perfeitamente. Utilize os atalhos abaixo para ações rápidas.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              + Novo Cliente
            </button>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              + Nova Usina
            </button>
            <button className="px-4 py-2 bg-white text-brand-dark hover:bg-blue-50 rounded-lg text-sm font-bold shadow-lg transition-colors">
              Ver Relatórios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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