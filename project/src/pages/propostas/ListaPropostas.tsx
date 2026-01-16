import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, FileText, CheckCircle, XCircle, Clock, Search, DollarSign, TrendingUp, MessageCircle } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

interface Proposta {
  id: number;
  nome_cliente_prospect: string;
  status: 'Rascunho' | 'Enviada' | 'Fechada' | 'Perdida';
  created_at: string;
  // O backend salva o JSON completo da simulação. 
  // Vamos assumir que você consegue ler 'economiaMensal' ou 'valorProposta' dele
  dados_simulacao: {
    consumoKwh: number;
    // Adicione outros campos se o backend retornar
  };
  // Se o backend já retornar valores calculados:
  valor_economia_mensal?: number; 
}

export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // KPIs (Indicadores para o Chefe)
  const [totalPotencial, setTotalPotencial] = useState(0);
  const [taxaConversao, setTaxaConversao] = useState(0);

  const loadPropostas = async () => {
    setLoading(true);
    try {
      // Chama a API (certifique-se que o backend retorna a lista)
      const data = await api.propostas.list().catch(() => []);
      const lista = Array.isArray(data) ? data : (data.data || []);
      
      setPropostas(lista);

      // CÁLCULO DE INDICADORES (Mágica para o chefe)
      // Aqui estamos simulando um cálculo. O ideal é que venha do backend ou do JSON da simulação
      const total = lista.reduce((acc: number, p: any) => {
        // Tenta pegar do JSON salvo ou usa um valor fictício se não tiver
        const economia = p.dados_simulacao?.economia_mensal || (p.dados_simulacao?.consumoKwh * 0.95) || 0; 
        return acc + economia;
      }, 0);
      setTotalPotencial(total);

      const fechadas = lista.filter((p: any) => p.status === 'Fechada').length;
      setTaxaConversao(lista.length > 0 ? (fechadas / lista.length) * 100 : 0);

    } catch (error) {
      console.error("Erro ao carregar propostas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPropostas();
  }, []);

  const handleStatusChange = async (id: number, novoStatus: string) => {
    if(!confirm(`Mudar status para ${novoStatus}?`)) return;
    try {
        await api.propostas.update(id, { status: novoStatus });
        loadPropostas(); // Recarrega para atualizar KPIs
    } catch (e) {
        alert("Erro ao atualizar status");
    }
  };

  const filtered = propostas.filter(p => 
    p.nome_cliente_prospect.toLowerCase().includes(busca.toLowerCase())
  );

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Pipeline de Vendas</h2>
          <p className="text-gray-500 mt-1">Acompanhe as propostas geradas e feche contratos</p>
        </div>
        <Link
          to="/simulacoes/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Simulação</span>
        </Link>
      </div>

      {/* --- KPI CARDS (VISÃO DO DONO) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Propostas na Mesa</p>
            <p className="text-2xl font-bold text-gray-900">{propostas.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Potencial Mensal (Est.)</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPotencial)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-gray-900">{taxaConversao.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* --- FILTRO E BUSCA --- */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome do cliente..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-brand-DEFAULT focus:border-brand-DEFAULT py-2 shadow-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* --- TABELA DE OPORTUNIDADES --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
           <div className="p-6 space-y-4">
             {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
           </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhuma proposta encontrada</h3>
            <p className="text-gray-500 max-w-sm mt-1 mb-6">
              Use o simulador para gerar novas oportunidades de negócio.
            </p>
            <Link to="/simulacoes/novo" className="text-brand-DEFAULT font-medium hover:underline">
              Ir para o Simulador
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Consumo (kWh)</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{p.nome_cliente_prospect}</div>
                        <div className="text-xs text-gray-500">ID: {p.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                        {p.dados_simulacao?.consumoKwh || '-'} kWh
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                            ${p.status === 'Fechada' ? 'bg-green-100 text-green-700 border-green-200' : 
                              p.status === 'Perdida' ? 'bg-red-100 text-red-700 border-red-200' :
                              p.status === 'Enviada' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {p.status === 'Fechada' && <CheckCircle className="w-3 h-3"/>}
                            {p.status === 'Perdida' && <XCircle className="w-3 h-3"/>}
                            {p.status === 'Enviada' && <Clock className="w-3 h-3"/>}
                            {p.status === 'Rascunho' && <FileText className="w-3 h-3"/>}
                            {p.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          {/* AÇÃO RÁPIDA: FECHAR NEGÓCIO */}
                          {p.status !== 'Fechada' && (
                              <button 
                                onClick={() => handleStatusChange(p.id, 'Fechada')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
                                title="Marcar como Vendido"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                          )}
                          
                          {/* AÇÃO RÁPIDA: WHATSAPP FOLLOW-UP */}
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Cobrar no WhatsApp"
                            onClick={() => window.open(`https://wa.me/?text=Olá ${p.nome_cliente_prospect}, conseguimos avaliar a proposta de energia solar?`, '_blank')}
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}