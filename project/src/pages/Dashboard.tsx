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
  CheckCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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

  // 🟢 NOVO ESTADO: Aqui vamos guardar as transações do fluxo de caixa para detalhar
  const [transacoes, setTransacoes] = useState<any[]>([]);

  const [historico, setHistorico] = useState<any[]>([]);

  // 1. Carrega Resumo (Cards e Fluxo de Caixa)
  useEffect(() => {
    async function carregarResumo() {
      try {
        setLoading(true);
        // 🟢 MUDANÇA: Agora o Dashboard busca os contadores E a lista de categorias do caixa
        const [respostaResumo, respostaFluxo] = await Promise.all([
          api.dashboard.getResumo(mesFiltro),
          api.fluxoCaixa.list(mesFiltro)
        ]);
        setDados(respostaResumo);
        setTransacoes(respostaFluxo.transacoes || []);
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

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const maxValorGrafico = Math.max(
    historico.reduce((max, item) => Math.max(max, item.faturamento), 0),
    1000
  );

  // 🟢 MATEMÁTICA DO CAIXA: Separa e soma as categorias de Receita e Custo
  const resumoCategorias = transacoes.reduce((acc: any, t: any) => {
    const cat = t.categoria || "OUTROS";
    if (!acc[cat]) acc[cat] = { tipo: t.tipo, total: 0 };
    acc[cat].total += Number(t.valor) || 0;
    return acc;
  }, {});

  const categoriasEntrada = Object.entries(resumoCategorias).filter(
    ([cat, c]: [string, any]) =>
      c.tipo === "ENTRADA" && cat !== "LUCRO / SPREAD" && cat !== "TRANSFERÊNCIA INTERNA"
  );

  const categoriasSaida = Object.entries(resumoCategorias).filter(
    ([cat, c]: [string, any]) =>
      c.tipo === "SAIDA" && cat !== "LUCRO / SPREAD" && cat !== "TRANSFERÊNCIA INTERNA"
  );

  const totalEntradasMes = categoriasEntrada.reduce((sum, item: any) => sum + item[1].total, 0);
  const totalSaidasMes = categoriasSaida.reduce((sum, item: any) => sum + item[1].total, 0);
  const spreadMes = resumoCategorias["LUCRO / SPREAD"];

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">

      {/* CABEÇALHO GERAL */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600 fill-blue-600" />
            Visão Geral
          </h1>
          <p className="text-gray-500 mt-1">Desempenho da gestão</p>
        </div>

        {/* Filtro do Mês */}
        <div className="flex items-center gap-3 bg-gray-50-card px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
          <Calendar size={20} className="text-blue-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mês de Referência</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Usinas */}
        <div className="bg-gray-50-card p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-5 hover:shadow-sm hover:border-orange-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 rounded-lg shadow-inner">
            <Zap size={28} className="fill-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Usinas</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? '...' : dados.contadores.usinas}</h3>
          </div>
        </div>

        {/* Consumidores */}
        <div className="bg-gray-50-card p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-5 hover:shadow-sm hover:border-blue-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg shadow-inner">
            <Users size={28} className="fill-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Consumidores</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? '...' : dados.contadores.consumidores}</h3>
          </div>
        </div>

        {/* Vínculos */}
        <div className="bg-gray-50-card p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-5 hover:shadow-sm hover:border-purple-200 transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <LinkIcon size={80} />
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-lg shadow-inner">
            <LinkIcon size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Contratos Ativos</p>
            <h3 className="text-3xl font-black text-gray-900 mt-1">{loading ? '...' : dados.contadores.vinculos}</h3>
          </div>
        </div>
      </div>
      {/* --- PARTE 2: FINANCEIRO DETALHADO (COM 1 GRÁFICO RESUMO) --- */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          Resultado Financeiro de {new Date(mesFiltro + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Receitas Brutas (SEM GRÁFICO, SÓ LISTA) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Receitas Brutas</span>
              <span className="text-2xl font-black text-gray-900">{fmt(totalEntradasMes)}</span>
            </div>

            {categoriasEntrada.length > 0 ? (
              <div className="flex-1 flex flex-col mt-2">
                <div className="space-y-4">
                  {categoriasEntrada.map(([cat, d]: any) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-bold uppercase items-center mb-1.5">
                        <span className="text-gray-600 truncate max-w-[140px]" title={cat}>{cat}</span>
                        <span className="text-gray-900">{fmt(d.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${totalEntradasMes > 0 ? (d.total / totalEntradasMes) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400 italic text-center">Nenhuma receita registrada no período.</p>
              </div>
            )}
          </div>

          {/* Custos / Repasses (SEM GRÁFICO, SÓ LISTA) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-red-600 uppercase">Custos / Repasses</span>
              <span className="text-2xl font-black text-red-700">{fmt(totalSaidasMes)}</span>
            </div>

            {categoriasSaida.length > 0 ? (
              <div className="flex-1 flex flex-col mt-2">
                <div className="space-y-4">
                  {categoriasSaida.map(([cat, d]: any) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-bold uppercase items-center mb-1.5">
                        <span className="text-gray-600 truncate max-w-[140px]" title={cat}>{cat}</span>
                        <span className="text-red-700">{fmt(d.total)}</span>
                      </div>
                      <div className="w-full bg-red-50 rounded-full h-1.5">
                        <div
                          className="bg-red-400 h-1.5 rounded-full"
                          style={{ width: `${totalSaidasMes > 0 ? (d.total / totalSaidasMes) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400 italic text-center">Nenhum custo registrado no período.</p>
              </div>
            )}
          </div>

          {/* Lucro Líquido (Spread) + ÚNICO GRÁFICO */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white flex flex-col group relative overflow-hidden h-full">
            <div className="relative z-10 flex flex-col h-full">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                  Resultado Líquido (Spread)
                </span>
                <h4 className="text-4xl font-black text-emerald-400 mb-2 drop-shadow-sm">
                  {spreadMes ? fmt(spreadMes.total) : "R$ 0,00"}
                </h4>
              </div>

              {/* GRÁFICO ÚNICO DA COMPOSIÇÃO */}
              <div className="flex-1 flex flex-col justify-center min-h-[160px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  {/* 🟢 Adicionamos margin top e bottom aqui para dar respiro */}
                  <PieChart margin={{ top: 10, right: 0, bottom: 10, left: 0 }}>
                    <Pie
                      data={[
                        { name: 'Receitas', value: totalEntradasMes },
                        { name: 'Despesas', value: totalSaidasMes },
                        { name: 'Spread', value: spreadMes ? spreadMes.total : 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40} // 🔴 Diminuído (antes era 45)
                      outerRadius={65} // 🔴 Diminuído (antes era 75)
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3b82f6" /> {/* Azul */}
                      <Cell fill="#ef4444" /> {/* Vermelho */}
                      <Cell fill="#10b981" /> {/* Verde */}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => fmt(Number(value || 0))}
                      contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* LEGENDA DO GRÁFICO */}
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Receitas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Despesas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold">Spread</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- PARTE 3: OPERACIONAL (BALANÇO DE ENERGIA) --- */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
          Performance Operacional (kWh)
        </h2>
        <BalancoEnergeticoCard mesFiltro={mesFiltro} />
      </div>

{/* --- PARTE 4: GRÁFICO DE EVOLUÇÃO ANUAL MULTICOLUNAS --- */}
      <div className="bg-gray-50-card rounded-lg border border-gray-200 p-6 shadow-sm">

        {/* Header do Gráfico */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={24} />
              Evolução Financeira Anual
            </h3>
            <p className="text-gray-500 text-sm mt-1">Comparativo de Receitas, Despesas e Lucro mês a mês.</p>
          </div>

          {/* SELETOR DE ANO */}
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setAnoFiltro(ano => ano - 1)}
              className="p-2 hover:bg-gray-50-card hover:shadow-sm rounded-lg text-gray-500 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-bold text-gray-900 px-4 min-w-[80px] text-center text-lg">{anoFiltro}</span>
            <button
              onClick={() => setAnoFiltro(ano => ano + 1)}
              className="p-2 hover:bg-gray-50-card hover:shadow-sm rounded-lg text-gray-500 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ÁREA DO GRÁFICO */}
        <div className="h-72 flex items-end justify-between gap-1 md:gap-2 px-2 relative">

          {/* Linhas de fundo (Grid) */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div className="w-full h-px bg-gray-100 border-t border-gray-200"></div>
          </div>

          {loadingGrafico ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500  animate-pulse z-10">
              Carregando dados...
            </div>
          ) : historico.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500  z-10">
              Sem dados para este ano.
            </div>
          ) : (
            historico.map((item, index) => {
              // Calculando as alturas de forma independente
              const hFat = Math.max((item.faturamento / maxValorGrafico) * 100, 2);
              const hCus = Math.max(((item.custo || 0) / maxValorGrafico) * 100, 2);
              const hLuc = Math.max(((item.lucro || 0) / maxValorGrafico) * 100, 2);
              const temValor = item.faturamento > 0 || (item.custo || 0) > 0 || (item.lucro || 0) > 0;

              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative z-10 h-full justify-end">

                  {/* Tooltip Inteligente */}
                  <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-900 text-white text-xs p-4 rounded-xl shadow-2xl z-50 whitespace-nowrap pointer-events-none transform translate-y-4 group-hover:translate-y-0">
                    <p className="font-bold border-b border-gray-700 pb-2 mb-2 text-center text-gray-300 uppercase tracking-widest text-[10px]">{item.mes} / {anoFiltro}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between gap-6 text-blue-400">
                        <span>Receitas Brutas:</span>
                        <span className="font-mono font-bold text-white">{fmt(item.faturamento)}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-red-400">
                        <span>Despesas / Custos:</span>
                        <span className="font-mono font-bold text-white">{fmt(item.custo || 0)}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-emerald-400 border-t border-gray-700 pt-2 mt-1">
                        <span>Resultado Líquido:</span>
                        <span className="font-mono font-bold text-white">{fmt(item.lucro || 0)}</span>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                  </div>

                  {/* Barrinhas Agrupadas (3 por mês) */}
                  <div className="w-full max-w-[50px] flex items-end justify-center gap-0.5 md:gap-1 relative h-full">
                    {/* Receita (Azul) */}
                    <div
                      className={`flex-1 rounded-t-sm transition-all duration-700 ${temValor ? 'bg-blue-400 group-hover:bg-blue-500' : 'bg-transparent'}`}
                      style={{ height: temValor ? `${hFat}%` : '0px' }}
                    ></div>
                    {/* Despesa (Vermelho) */}
                    <div
                      className={`flex-1 rounded-t-sm transition-all duration-700 delay-75 ${temValor ? 'bg-red-400 group-hover:bg-red-500' : 'bg-transparent'}`}
                      style={{ height: temValor ? `${hCus}%` : '0px' }}
                    ></div>
                    {/* Lucro (Verde) */}
                    <div
                      className={`flex-1 rounded-t-sm transition-all duration-700 delay-150 ${temValor ? 'bg-emerald-400 group-hover:bg-emerald-500' : 'bg-transparent'}`}
                      style={{ height: temValor ? `${hLuc}%` : '0px' }}
                    ></div>
                  </div>

                  {/* Nome do Mês */}
                  <span className={`text-[9px] md:text-xs font-bold mt-4 transition-colors uppercase tracking-wider ${temValor ? 'text-gray-500 group-hover:text-blue-600' : 'text-gray-300'}`}>
                    {item.mes.slice(0, 3)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Legenda do Gráfico Anual */}
        <div className="flex justify-center gap-6 mt-8 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-400"></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lucro Líquido</span>
          </div>
        </div>

      </div>

    </div>
  );
}