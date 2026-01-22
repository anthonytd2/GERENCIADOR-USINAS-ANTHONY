import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  DollarSign,
  Activity,
  Zap,
  Users,
  Link as LinkIcon
} from 'lucide-react';

export default function Dashboard() {
  const mesAtual = new Date().toISOString().slice(0, 7);
  const [mesFiltro, setMesFiltro] = useState(mesAtual);
  const [loading, setLoading] = useState(true);
  
  const [dados, setDados] = useState({
    contadores: { usinas: 0, consumidores: 0, vinculos: 0 },
    financeiro: { faturamento: 0, custo: 0, lucro: 0 }
  });

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const resposta = await api.dashboard.getResumo(mesFiltro);
      setDados(resposta);
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, [mesFiltro]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-blue-600" />
            Visão Geral
          </h1>
          <p className="text-gray-500 mt-1">Bem-vindo ao painel de controle.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <Calendar size={20} className="text-gray-400 ml-2" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mês Financeiro</span>
            <input 
              type="month" 
              className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- PARTE 1: CONTADORES (VOLTARAM!) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Usinas Ativas</p>
            <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : dados.contadores.usinas}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Consumidores</p>
            <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : dados.contadores.consumidores}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <LinkIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Contratos (Vínculos)</p>
            <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : dados.contadores.vinculos}</h3>
          </div>
        </div>
      </div>

      {/* --- PARTE 2: FINANCEIRO (CORRIGIDO) --- */}
      <h2 className="text-lg font-bold text-gray-700 mt-8">Resultado Financeiro ({mesFiltro.split('-').reverse().join('/')})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FATURAMENTO */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign size={100} />
          </div>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Faturamento Total</p>
          <h3 className="text-3xl font-black text-gray-800">
            {loading ? '...' : fmt(dados.financeiro.faturamento)}
          </h3>
          <p className="text-xs text-gray-400 mt-2">Soma dos boletos gerados</p>
        </div>

        {/* CUSTO OPERACIONAL */}
        <div className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingDown size={100} />
          </div>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Custo Operacional</p>
          <h3 className="text-3xl font-black text-gray-800">
            {loading ? '...' : fmt(dados.financeiro.custo)}
          </h3>
          <p className="text-xs text-gray-400 mt-2">Pagamentos Usina + Fio B</p>
        </div>

        {/* LUCRO LÍQUIDO */}
        <div className="bg-green-50 p-6 rounded-2xl border border-green-200 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={100} className="text-green-600" />
          </div>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Lucro Líquido</p>
          <h3 className="text-4xl font-black text-green-700">
            {loading ? '...' : fmt(dados.financeiro.lucro)}
          </h3>
          <p className="text-xs text-green-600/70 mt-2 font-medium">O que sobrou no caixa</p>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <TrendingUp className="mx-auto text-gray-200 mb-4" size={48} />
        <h3 className="text-lg font-bold text-gray-400">Gráficos de Evolução</h3>
        <p className="text-gray-400 text-sm">Em breve o histórico aparecerá aqui.</p>
      </div>

    </div>
  );
}