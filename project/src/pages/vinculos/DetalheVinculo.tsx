import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, User, Zap, DollarSign, Calendar, FileText } from 'lucide-react';

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [vinculo, setVinculo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      // 1. Carrega dados do Vínculo
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);

      // 2. Carrega Histórico Financeiro deste Consumidor
      // O endpoint busca pelo ID do Consumidor que está no vínculo
      if (dadosVinculo && dadosVinculo.consumidor_id) {
        const financeiro = await api.custom(`/fechamentos/consumidor/${dadosVinculo.consumidor_id}`, 'GET');
        setHistorico(financeiro || []);
      }
      
    } catch (error) {
      console.error('Erro ao carregar detalhes', error);
      alert('Erro ao carregar dados do vínculo.');
    } finally {
      setLoading(false);
    }
  }

  const fmtMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtData = (d: string) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const fmtMes = (d: string) => new Date(d).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando informações...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/vinculos')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Vínculo</h1>
          <p className="text-gray-500">Contrato entre Consumidor e Usina</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD PRINCIPAL - INFORMAÇÕES */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Resumo do Contrato
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Consumidor</label>
                <p className="font-medium text-gray-900">{vinculo.nome_consumidor}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Usina</label>
                <p className="font-medium text-gray-900">{vinculo.nome_proprietario}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase">Porcentagem da Usina</label>
                <p className="text-2xl font-bold text-blue-600">{vinculo.percentual_de_participacao}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ABA DIREITA - HISTÓRICO FINANCEIRO */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" /> 
                Histórico Financeiro
              </h2>
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {historico.length} faturas encontradas
              </span>
            </div>

            {historico.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum fechamento realizado para este cliente ainda.</p>
                <button 
                  onClick={() => navigate('/financeiro/fechamento')}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  Ir para Fechamento Mensal
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                      <th className="p-4">Mês Ref.</th>
                      <th className="p-4">Consumo (kWh)</th>
                      <th className="p-4">Compensado</th>
                      <th className="p-4">Economia</th>
                      <th className="p-4 text-right">Valor Boleto</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historico.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium capitalize text-gray-900">
                          {fmtMes(item.mes_referencia)}
                        </td>
                        <td className="p-4 text-gray-600">
                          {item.consumo_kwh} kWh
                        </td>
                        <td className="p-4 text-blue-600 font-medium">
                          {item.energia_compensada} kWh
                        </td>
                        <td className="p-4 text-green-600">
                          {fmtMoeda(item.economia_bruta)}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900">
                          {fmtMoeda(item.valor_final_cliente)}
                        </td>
                        <td className="p-4 text-center">
                          <button className="p-1 hover:bg-blue-50 text-blue-600 rounded" title="Ver Recibo/Detalhes">
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}