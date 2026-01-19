import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, FileText, Calendar, User, ArrowRight, Trash2, MessageCircle, DollarSign, Zap } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

// Interface completa para não perder dados
interface Proposta {
  id: number;
  nome_cliente_prospect: string;
  status: string;
  created_at: string;
  dados_simulacao: {
    telefone?: string;
    mediaConsumo?: number;
    economiaMensal?: number;
    kitEscolhido?: {
      potencia?: number;
      valor?: number;
    };
  };
}

export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  const loadPropostas = () => {
    setLoading(true);
    api.propostas.list()
      .then((data: any) => {
        setPropostas(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPropostas();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta simulação?')) return;
    try {
      await api.propostas.delete(id);
      loadPropostas();
    } catch (error) {
      alert('Erro ao excluir simulação');
    }
  };

  const handleWhatsApp = (p: Proposta) => {
    const telefone = p.dados_simulacao?.telefone?.replace(/\D/g, '');
    if (!telefone) return alert('Telefone não cadastrado na simulação');
    
    const msg = `Olá ${p.nome_cliente_prospect}, tudo bem? Gostaria de falar sobre sua simulação de energia solar.`;
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filtragem
  const filtrados = propostas.filter(p => {
    const matchBusca = (p.nome_cliente_prospect || '').toLowerCase().includes(busca.toLowerCase());
    const matchStatus = statusFiltro === 'todos' ? true : (p.status || 'rascunho').toLowerCase() === statusFiltro;
    return matchBusca && matchStatus;
  });

  // Função para formatar moeda
  const BRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Pipeline de Vendas</h2>
          <p className="text-gray-500 mt-1">Gerencie suas simulações e propostas comerciais</p>
        </div>
        <Link
          to="/propostas/novo"
          className="flex items-center gap-2 px-6 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Simulação</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* BARRA DE FILTROS E BUSCA */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
          
          {/* Filtros de Status (Pipeline) */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['todos', 'rascunho', 'enviada', 'aprovada', 'rejeitada'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFiltro(st)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  statusFiltro === st 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p>Nenhuma simulação encontrada neste filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">Cliente / Data</th>
                  <th className="px-6 py-4 text-left">Consumo</th>
                  <th className="px-6 py-4 text-left text-green-700">Economia Est.</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{p.nome_cliente_prospect}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{p.dados_simulacao?.mediaConsumo || 0} kWh</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-3 py-1 rounded-lg w-fit">
                        <DollarSign className="w-4 h-4" />
                        {BRL(p.dados_simulacao?.economiaMensal || 0)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                        p.status === 'aprovada' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        p.status === 'enviada' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {p.status || 'Rascunho'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão WhatsApp */}
                        <button 
                          onClick={() => handleWhatsApp(p)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Enviar no WhatsApp"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Botão Excluir */}
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Simulação"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        {/* Botão Abrir */}
                        <Link 
                          to={`/propostas/${p.id}`}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                        >
                          Abrir <ArrowRight className="w-4 h-4" />
                        </Link>
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