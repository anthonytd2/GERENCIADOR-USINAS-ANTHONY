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

  const [historico, setHistorico] = useState<any[]>([]);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      // 1. Carrega Resumo (Já existia)
      const resposta = await api.dashboard.getResumo(mesFiltro);
      setDados(resposta);

      // 2. Carrega Histórico (ADICIONE ESTAS 2 LINHAS)
      const { data: respostaHistorico } = await api.client.get('/dashboard/historico');
      setHistorico(respostaHistorico);

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
  // Calcula o teto do gráfico para as barras ficarem proporcionais
  const maxValorGrafico = historico.reduce((max, item) => Math.max(max, item.faturamento), 0) || 1;

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

      {/* --- PARTE 3: GRÁFICO DE EVOLUÇÃO (NOVO) --- */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={20} />
              Evolução Semestral
            </h3>
            <p className="text-gray-400 text-sm">Comparativo de Faturamento vs Lucro Líquido</p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 rounded-sm border border-blue-200"></div> Faturamento
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Lucro Real
            </div>
          </div>
        </div>

        {/* ÁREA DO GRÁFICO */}
        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2 border-b border-gray-100 pb-2 relative">

          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium animate-pulse">Carregando gráfico...</div>
          ) : historico.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium">Sem dados históricos ainda</div>
          ) : (
            historico.map((item, index) => {
              // Calcula altura da barra em %
              const hFat = Math.max((item.faturamento / maxValorGrafico) * 100, 2);
              const hLuc = Math.min(Math.max((item.lucro / maxValorGrafico) * 100, 2), 100);

              return (
                <div key={index} className="flex flex-col items-center flex-1 group relative z-10 h-full justify-end">

                  {/* Tooltip Melhorado (Mostra valor completo ao passar o mouse) */}
                  <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                    <p className="font-bold border-b border-gray-700 pb-1 mb-2 text-center text-gray-300">{item.mes}</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between gap-4 text-blue-200">
                        <span>Fat:</span>
                        <span className="font-mono font-bold">{fmt(item.faturamento)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-emerald-300">
                        <span>Lucro:</span>
                        <span className="font-mono font-bold">{fmt(item.lucro)}</span>
                      </div>
                    </div>
                    {/* Seta do balão */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                  </div>

                  {/* Barras */}
                  <div className="w-full max-w-[60px] flex items-end justify-center relative h-full">

                    {/* Barra Azul (Faturamento) - AGORA MAIS VIVA (Blue-400) */}
                    <div
                      className="w-full bg-blue-400 border border-blue-500 rounded-t-sm absolute bottom-0 transition-all duration-700 hover:bg-blue-500 shadow-sm"
                      style={{ height: `${hFat}%` }}
                    ></div>

                    {/* Barra Verde (Lucro) */}
                    <div
                      className="w-2/3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm z-10 relative transition-all duration-1000 hover:brightness-110 shadow-lg shadow-emerald-900/20"
                      style={{ height: `${hLuc}%` }}
                    >
                      {/* Valor no topo (Mostra o valor completo agora) */}
                      {hLuc > 80 && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 rounded shadow-sm whitespace-nowrap z-20">
                          {fmt(item.lucro)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mês */}
                  <span className="text-xs font-bold text-gray-500 mt-3 group-hover:text-blue-600 transition-colors">{item.mes}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}