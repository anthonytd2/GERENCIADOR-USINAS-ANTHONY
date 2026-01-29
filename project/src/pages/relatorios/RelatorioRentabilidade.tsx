import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

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
      // Chama a função que criamos no passo anterior
      const resultado = await api.relatorios.rentabilidade(mes);
      setData(resultado || []);
    } catch (error) {
      console.error('Erro ao carregar relatório', error);
      alert('Erro ao carregar dados. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  }

  // Cálculos de Resumo
  const lucroTotal = data.reduce((acc, item) => acc + Number(item.spread), 0);
  const spreadMedio = data.length > 0 ? (data.reduce((acc, item) => acc + Number(item.spread_unitario), 0) / data.length) : 0;
  const maiorSpread = data.length > 0 ? Math.max(...data.map(item => Number(item.spread_unitario))) : 0;

  // Formatadores
  const fmt = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
  const fmtUnit = (v: any) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(Number(v) || 0);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Inteligência de Rentabilidade
          </h1>
          <p className="text-gray-500 mt-1">Ranking de performance dos seus contratos de energia.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
          <Calendar className="text-gray-400 w-5 h-5" />
          <input 
            type="month" 
            value={mes} 
            onChange={(e) => setMes(e.target.value)} 
            className="text-gray-700 font-bold bg-transparent outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Calculando indicadores...</div>
      ) : (
        <>
          {/* CARDS DE RESUMO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase">Lucro Líquido (Spread)</p>
              <h3 className="text-4xl font-black text-green-600 mt-2">{fmt(lucroTotal)}</h3>
              <p className="text-sm text-gray-400 mt-1">Neste mês selecionado</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase">Spread Médio da Carteira</p>
              <h3 className="text-4xl font-black text-blue-600 mt-2">R$ {fmtUnit(spreadMedio)}</h3>
              <p className="text-sm text-gray-400 mt-1">Por kWh compensado</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg">
              <p className="text-xs font-bold text-slate-400 uppercase">Melhor Margem</p>
              <h3 className="text-4xl font-black text-yellow-400 mt-2">R$ {fmtUnit(maiorSpread)}</h3>
              <p className="text-sm text-slate-400 mt-1">O recorde do mês</p>
            </div>
          </div>

          {/* GRÁFICO VISUAL (BARRAS) */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Comparativo Visual (Top 10 Melhores Margens)
            </h3>
            
            <div className="flex items-end gap-2 h-64 w-full overflow-x-auto pb-4">
              {data.slice(0, 10).map((item, index) => {
                const altura = Math.max((Number(item.spread_unitario) / maiorSpread) * 100, 10); // Altura %
                return (
                  <div key={item.vinculo_id} className="flex-1 min-w-[60px] flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 w-max">
                      {item.nome_consumidor}<br/>
                      R$ {fmtUnit(item.spread_unitario)}
                    </div>
                    {/* Barra */}
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 relative ${Number(item.spread_unitario) < 0.1 ? 'bg-red-400' : 'bg-blue-500 group-hover:bg-blue-600'}`}
                      style={{ height: `${altura}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600">
                        {fmtUnit(item.spread_unitario)}
                      </span>
                    </div>
                    {/* Legenda */}
                    <div className="mt-2 text-[10px] text-gray-400 truncate w-full text-center rotate-0">
                      {item.nome_consumidor.split(' ')[0]}
                    </div>
                  </div>
                )
              })}
              {data.length === 0 && <div className="w-full text-center text-gray-400 py-10">Sem dados para exibir neste mês.</div>}
            </div>
          </div>

          {/* TABELA DE RANKING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Ranking Completo (Do Melhor para o Pior)
              </h3>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Posição</th>
                  <th className="px-6 py-4">Vínculo (Cliente + Usina)</th>
                  <th className="px-6 py-4 text-center">Energia (kWh)</th>
                  <th className="px-6 py-4 text-center">Spread Unitário</th>
                  <th className="px-6 py-4 text-right">Lucro Total (R$)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, index) => {
                  const unitario = Number(item.spread_unitario);
                  const isRuim = unitario < 0.10; // Critério de alerta: Margem abaixo de R$ 0,10
                  const isTop = index < 3;

                  return (
                    <tr key={item.vinculo_id} className={`hover:bg-gray-50 transition-colors ${isRuim ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 font-bold text-gray-500">
                        {isTop ? <span className="text-xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span> : `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{item.nome_consumidor}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <ZapIcon /> {item.nome_usina}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-mono">
                        {item.energia_compensada} kWh
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isRuim ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          R$ {fmtUnit(unitario)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">
                        {fmt(item.spread)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isRuim && (
                          <div className="flex items-center justify-center gap-1 text-red-500 text-xs font-bold" title="Margem muito baixa!">
                            <AlertTriangle size={14} /> Atenção
                          </div>
                        )}
                        {!isRuim && <span className="text-green-500 text-xs font-bold">OK</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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