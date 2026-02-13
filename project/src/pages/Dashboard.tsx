import React, { useEffect, useState } from 'react';
import BalancoEnergeticoCard from '../components/dashboard/BalancoEnergeticoCard';
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
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const dataHoje = new Date();
  const mesAtualISO = dataHoje.toISOString().slice(0, 7);

  // Filtros
  const [mesFiltro, setMesFiltro] = useState(mesAtualISO);
  const [anoFiltro, setAnoFiltro] = useState(dataHoje.getFullYear());

  const [loading, setLoading] = useState(true);
  const [loadingGrafico, setLoadingGrafico] = useState(false);

  const [dados, setDados] = useState({
    contadores: { usinas: 0, consumidores: 0, vinculos: 0 },
    financeiro: { faturamento: 0, custo: 0, lucro: 0 }
  });

  const [historico, setHistorico] = useState<any[]>([]);

  // 1. Carrega Resumo (Cards)
  useEffect(() => {
    async function carregarResumo() {
      try {
        setLoading(true);
        const resposta = await api.dashboard.getResumo(mesFiltro);
        setDados(resposta);
      } catch (error) {
        console.error('Erro resumo', error);
      } finally {
        setLoading(false);
      }
    }
    carregarResumo();
  }, [mesFiltro]);

  // 2. Carrega Gráfico
  useEffect(() => {
    async function carregarGrafico() {
      try {
        setLoadingGrafico(true);
        const respostaHistorico = await api.dashboard.getHistorico(anoFiltro);
        setHistorico(respostaHistorico);
      } catch (error) {
        console.error('Erro grafico', error);
      } finally {
        setLoadingGrafico(false);
      }
    }
    carregarGrafico();
  }, [anoFiltro]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const maxValorGrafico = Math.max(
    historico.reduce((max, item) => Math.max(max, item.faturamento), 0),
    1000
  );

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">

      {/* CABEÇALHO GERAL */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600 fill-blue-600" />
            Visão Geral
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe o desempenho da sua gestão de energia.</p>
        </div>

        {/* Filtro do Mês */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <Calendar size={20} className="text-blue-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mês de Referência</span>
            <input
              type="month"
              className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer font-mono"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- PARTE 1: ESTRUTURA (CONTADORES) --- */}
      {/* Movido para o topo: Visão rápida de "O que eu tenho agora" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Usinas */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-orange-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-2xl shadow-inner">
            <Zap size={28} className="fill-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Usinas Ativas</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{loading ? '...' : dados.contadores.usinas}</h3>
          </div>
        </div>

        {/* Consumidores */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl shadow-inner">
            <Users size={28} className="fill-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Consumidores</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{loading ? '...' : dados.contadores.consumidores}</h3>
          </div>
        </div>

        {/* Vínculos */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-purple-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <LinkIcon size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-2xl shadow-inner">
            <LinkIcon size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Contratos Ativos</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{loading ? '...' : dados.contadores.vinculos}</h3>
          </div>
        </div>
      </div>

      {/* --- PARTE 2: FINANCEIRO (CARDS GRANDES) --- */}
      {/* O resultado financeiro é o que o gestor quer ver logo de cara */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          Resultado Financeiro de {new Date(mesFiltro + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* FATURAMENTO */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <DollarSign size={120} />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  <Activity size={12} /> RECEITA BRUTA
                </div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                  {loading ? '...' : fmt(dados.financeiro.faturamento)}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">Faturamento Total</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingUp size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* CUSTO */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <TrendingDown size={120} />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
                  <TrendingDown size={12} /> DESPESAS
                </div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                  {loading ? '...' : fmt(dados.financeiro.custo)}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">Custo Operacional</span>
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Activity size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* LUCRO LÍQUIDO (DESTAQUE) */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-200 relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
              <Wallet size={140} />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm border border-white/10">
                  <Wallet size={12} /> RESULTADO LÍQUIDO
                </div>
                <h3 className="text-5xl font-black text-white tracking-tight drop-shadow-sm">
                  {loading ? '...' : fmt(dados.financeiro.lucro)}
                </h3>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-emerald-50 font-medium">Spread</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                  <DollarSign size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PARTE 3: OPERACIONAL (BALANÇO DE ENERGIA) --- */}
      {/* Agora vem a explicação técnica do "porquê" do financeiro */}
      <div>
         <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
            Performance Operacional (kWh)
          </h2>
        <BalancoEnergeticoCard mesFiltro={mesFiltro} />
      </div>

      {/* --- PARTE 4: GRÁFICO DE EVOLUÇÃO --- */}
      {/* Por fim, o histórico para análise de tendência */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">

        {/* Header do Gráfico */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={24} />
              Evolução Financeira Anual
            </h3>
            <p className="text-gray-500 text-sm mt-1">Comparativo de performance financeira mês a mês.</p>
          </div>

          {/* SELETOR DE ANO */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setAnoFiltro(ano => ano - 1)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-gray-800 px-4 min-w-[80px] text-center text-lg">{anoFiltro}</span>
            <button
              onClick={() => setAnoFiltro(ano => ano + 1)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ÁREA DO GRÁFICO */}
        <div className="h-72 flex items-end justify-between gap-2 md:gap-4 px-2 relative">

          {/* Linhas de fundo (Grid) */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-gray-200"></div>
          </div>

          {loadingGrafico ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium animate-pulse z-10">
              Carregando dados...
            </div>
          ) : historico.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium z-10">
              Sem dados para este ano.
            </div>
          ) : (
            historico.map((item, index) => {
              const hFat = Math.max((item.faturamento / maxValorGrafico) * 100, 2);
              const hLuc = Math.min(Math.max((item.lucro / maxValorGrafico) * 100, 2), 100);
              const temValor = item.faturamento > 0 || item.lucro > 0;

              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative z-10 h-full justify-end">

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-900 text-white text-xs p-4 rounded-xl shadow-2xl z-50 whitespace-nowrap pointer-events-none transform translate-y-4 group-hover:translate-y-0">
                    <p className="font-bold border-b border-gray-700 pb-2 mb-2 text-center text-gray-300 uppercase tracking-widest text-[10px]">{item.mes} / {anoFiltro}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between gap-6 text-blue-300">
                        <span>Faturamento:</span>
                        <span className="font-mono font-bold text-white">{fmt(item.faturamento)}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-emerald-400">
                        <span>Lucro Líquido:</span>
                        <span className="font-mono font-bold text-white">{fmt(item.lucro)}</span>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                  </div>

                  {/* Barras */}
                  <div className="w-full max-w-[40px] md:max-w-[60px] flex items-end justify-center relative h-full">

                    {/* Barra Faturamento (Azul) */}
                    <div
                      className={`w-full rounded-t-lg absolute bottom-0 transition-all duration-700 ${temValor ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-transparent'}`}
                      style={{ height: temValor ? `${hFat}%` : '0px' }}
                    ></div>

                    {/* Barra Lucro (Verde - Destaque) */}
                    <div
                      className={`w-2/3 rounded-t-md z-10 relative transition-all duration-1000 ${temValor ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-200 group-hover:brightness-110' : 'bg-transparent'}`}
                      style={{ height: temValor ? `${hLuc}%` : '0px' }}
                    ></div>
                  </div>

                  {/* Nome do Mês */}
                  <span className={`text-[10px] md:text-xs font-bold mt-4 transition-colors uppercase tracking-wider ${temValor ? 'text-gray-500 group-hover:text-blue-600' : 'text-gray-300'}`}>
                    {item.mes.slice(0, 3)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}