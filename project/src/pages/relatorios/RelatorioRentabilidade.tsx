import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, DollarSign, Calendar, AlertTriangle, Download } from 'lucide-react';
// Importando a nova biblioteca gráfica
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ReferenceLine
} from 'recharts';

export default function RelatorioRentabilidade() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    carregarDados();
  }, [mes]);

  async function carregarDados() {
    setLoading(true);
    try {
      const resultado = await api.relatorios.rentabilidade(mes);
      setData(resultado || []);
    } catch (error) {
      console.error('Erro ao carregar relatório', error);
      // alert('Erro ao carregar dados.'); // Removido para não atrapalhar
    } finally {
      setLoading(false);
    }
  }

  // Cálculos de Resumo
  const lucroTotal = data.reduce((acc, item) => acc + Number(item.spread), 0);
  const spreadMedio = data.length > 0 ? (data.reduce((acc, item) => acc + Number(item.spread_unitario), 0) / data.length) : 0;
  
  // Pegamos apenas os Top 10 para o gráfico não ficar polúido
  const dadosGrafico = data.slice(0, 10).map(item => ({
    ...item,
    // Encurtamos o nome para o gráfico (Ex: "Joao Silva" vira "Joao")
    nome_curto: item.nome_consumidor.split(' ')[0],
    spread_unitario_num: Number(item.spread_unitario)
  }));

  const maiorSpread = dadosGrafico.length > 0 ? Math.max(...dadosGrafico.map(d => d.spread_unitario_num)) : 0;

  // Formatadores
  const fmt = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
  const fmtUnit = (v: any) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(Number(v) || 0);

  // Componente Personalizado do Tooltip (A caixinha que aparece ao passar o mouse)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dados = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700">
          <p className="font-bold text-lg mb-1">{dados.nome_consumidor}</p>
          <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
            <ZapIcon /> {dados.nome_usina}
          </p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-slate-400">Margem Unitária:</span> <span className="font-bold text-yellow-400">R$ {fmtUnit(dados.spread_unitario)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Lucro Total:</span> <span className="font-bold text-green-400">{fmt(dados.spread)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-400">Energia:</span> <span className="font-bold text-blue-300">{dados.energia_compensada} kWh</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-600/30">
              <BarChart3 className="w-8 h-8" />
            </div>
            Inteligência de Rentabilidade
          </h1>
          <p className="text-gray-500 mt-2 ml-1">Análise detalhada de margem por cliente e usina.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
            <Calendar className="w-5 h-5" />
          </div>
          <input 
            type="month" 
            value={mes} 
            onChange={(e) => setMes(e.target.value)} 
            className="text-gray-700 font-bold bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400 animate-pulse">
          <BarChart3 size={48} className="mb-4 opacity-50" />
          <p>Calculando indicadores de performance...</p>
        </div>
      ) : (
        <>
          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro Líquido (Spread)</p>
                  <h3 className="text-4xl font-black text-gray-800 mt-1">{fmt(lucroTotal)}</h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-400">Total acumulado no mês</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spread Médio</p>
                  <h3 className="text-4xl font-black text-blue-600 mt-1">R$ {fmtUnit(spreadMedio)}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-sm text-gray-400">Média por kWh compensado</p>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Melhor Margem</p>
                  <h3 className="text-4xl font-black text-yellow-400 mt-1">R$ {fmtUnit(maiorSpread)}</h3>
                </div>
                <div className="p-3 bg-white/10 text-yellow-400 rounded-xl">
                  <BarChart3 size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-400">Recorde unitário do mês</p>
            </div>
          </div>

          {/* GRÁFICO PROFISSIONAL (RECHARTS) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Top 10 Melhores Margens (R$/kWh)
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
                Passar o mouse para detalhes
              </span>
            </div>
            
            <div className="w-full h-[400px]">
              {dadosGrafico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    {/* Definição do Degradê das Barras */}
                    <defs>
                      <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpreadTop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    
                    <XAxis 
                      dataKey="nome_curto" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                    
                    <Bar dataKey="spread_unitario_num" radius={[8, 8, 0, 0]} barSize={50}>
                      {dadosGrafico.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index < 3 ? "url(#colorSpreadTop)" : "url(#colorSpread)"} 
                          stroke={index < 3 ? "#16a34a" : "#2563eb"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Sem dados para gerar gráfico neste mês.
                </div>
              )}
            </div>
          </div>

          {/* TABELA DE RANKING */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Ranking Completo
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100/50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Pos</th>
                    <th className="px-6 py-4">Cliente / Usina</th>
                    <th className="px-6 py-4 text-center">Energia</th>
                    <th className="px-6 py-4 text-center">Spread Unit.</th>
                    <th className="px-6 py-4 text-right">Lucro Total</th>
                    <th className="px-6 py-4 text-center rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item, index) => {
                    const unitario = Number(item.spread_unitario);
                    const isRuim = unitario < 0.10;
                    const isTop = index < 3;

                    return (
                      <tr key={item.vinculo_id} className={`hover:bg-blue-50/30 transition-colors group ${isRuim ? 'bg-red-50/10' : ''}`}>
                        <td className="px-6 py-4 font-bold text-gray-400">
                          {isTop ? (
                            <span className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-700 rounded-full text-lg shadow-sm">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="ml-2">#{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{item.nome_consumidor}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <ZapIcon /> {item.nome_usina}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-mono bg-gray-50/30 rounded-lg mx-2">
                          {item.energia_compensada} kWh
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isRuim ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            R$ {fmtUnit(unitario)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                          {fmt(item.spread)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isRuim ? (
                            <div className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100">
                              <AlertTriangle size={12} /> Atenção
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold border border-green-100">
                              Excelente
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="p-12 text-center text-gray-400 bg-gray-50">
                  Nenhum dado financeiro encontrado para este mês.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Ícone auxiliar pequeno
function ZapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
  )
}