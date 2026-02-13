import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  mesFiltro?: string;
}

export default function BalancoEnergeticoCard({ mesFiltro }: Props) {
  const [dados, setDados] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const resResumo = await api.dashboardBalanco.get(mesFiltro);
        setDados(resResumo);

        const ano = mesFiltro ? parseInt(mesFiltro.split('-')[0]) : new Date().getFullYear();
        const resHistorico = await api.dashboardBalanco.getHistorico(ano);
        setHistorico(resHistorico);
      } catch (error) {
        console.error("Erro balanço:", error);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [mesFiltro]);

  if (loading || !dados) return <div className="h-96 bg-white rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Calculando Balanço Histórico...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" /> Balanço Energético (Histórico)
        </h3>
        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-100">
          Mês Ref: {dados.realizado.mes}
        </span>
      </div>

      {/* CARDS DE NÚMEROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Geração (Usinas)</p>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Potencial</p>
            <p className="text-2xl font-black text-green-800">{dados.previsto.geracao.toLocaleString('pt-BR')} kWh</p>
          </div>
          <p className="text-xs text-gray-400 px-2">Real: <b>{dados.realizado.geracao.toLocaleString('pt-BR')} kWh</b></p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Consumo (Carteira)</p>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Contratado</p>
            <p className="text-2xl font-black text-blue-800">{dados.previsto.consumo.toLocaleString('pt-BR')} kWh</p>
          </div>
          <p className="text-xs text-gray-400 px-2">Real: <b>{dados.realizado.consumo.toLocaleString('pt-BR')} kWh</b></p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Saldo Operacional</p>
          <div className={`p-4 rounded-xl border ${dados.saldo.previsto >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-[10px] font-bold uppercase mb-1">Saldo Teórico</p>
            <div className="flex items-center gap-2">
              {dados.saldo.previsto >= 0 ? <TrendingUp size={20} className="text-indigo-600"/> : <TrendingDown size={20} className="text-red-600"/>}
              <p className="text-2xl font-black text-indigo-900">{dados.saldo.previsto.toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 px-2">Saldo Real: <b className={dados.saldo.realizado < 0 ? 'text-red-500' : ''}>{dados.saldo.realizado.toLocaleString('pt-BR')} kWh</b></p>
        </div>
      </div>

      {/* GRÁFICO VERTICAL MÊS A MÊS */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
            <BarChart3 size={16} /> Evolução Anual: Planejado vs Realizado
        </h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
              <YAxis hide axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR')} kWh`]}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '11px'}} />
              
              {/* CORES CONFORME SOLICITADO */}
              <Bar dataKey="PrevistoGeracao" name="Potencial Geração" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={10} />
              <Bar dataKey="RealizadoGeracao" name="Auditoria Geração" fill="#f97316" radius={[3, 3, 0, 0]} barSize={10} />
              <Bar dataKey="PrevistoConsumo" name="Potencial Consumo" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={10} />
              <Bar dataKey="RealizadoConsumo" name="Auditoria Consumo" fill="#eab308" radius={[3, 3, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}