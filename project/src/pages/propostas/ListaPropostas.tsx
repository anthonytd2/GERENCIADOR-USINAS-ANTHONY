import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Calendar,
  Zap,
  MessageCircle,
  ExternalLink,
  Trash2,
  ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';

// Interface das Propostas
interface Proposta {
  id: number;
  nome_cliente_prospect: string;
  status: string;
  created_at: string;
  dados_simulacao: {
    usinaSelecionada?: { nome: string };
    consumoKwh?: number;
    economiaRealCliente?: number;
    economiaMensal?: number;
  };
}

// Configuração das Colunas do Kanban
const COLUNAS = [
  { id: 'NOVO', titulo: '🆕 Novos Leads', cor: 'border-blue-400 bg-blue-50 text-blue-700' },
  { id: 'ENVIADO', titulo: '📄 Proposta Enviada', cor: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { id: 'NEGOCIACAO', titulo: '🤝 Em Negociação', cor: 'border-purple-400 bg-purple-50 text-purple-700' },
  { id: 'FECHADO', titulo: '✅ Fechado', cor: 'border-green-400 bg-green-50 text-green-700' },
  { id: 'PERDIDO', titulo: '❌ Perdido', cor: 'border-gray-400 bg-gray-50 text-gray-500' }
];

export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  // KPIs
  const [totalPotencial, setTotalPotencial] = useState(0);
  const [taxaConversao, setTaxaConversao] = useState(0);

  // Carrega Propostas e Calcula KPIs
  const loadPropostas = async () => {
    setLoading(true);
    try {
      const data = await api.propostas.list().catch(() => []);
      const lista = Array.isArray(data) ? data : (data.data || []);
      
      // Normaliza status para maiúsculo para bater com as colunas (Ex: 'Fechada' -> 'FECHADO')
      const listaNormalizada = lista.map((p: any) => ({
          ...p,
          status: normalizarStatus(p.status)
      }));

      setPropostas(listaNormalizada);

      // CÁLCULO DE INDICADORES (Mantido do seu código original)
      const total = listaNormalizada.reduce((acc: number, p: any) => {
        const dados = p.dados_simulacao || {};
        const economia = Number(dados.economiaRealCliente || dados.economiaMensal || (Number(dados.consumoKwh) * 0.95) || 0); 
        return acc + economia;
      }, 0);
      setTotalPotencial(total);

      const fechadas = listaNormalizada.filter((p: any) => p.status === 'FECHADO').length;
      setTaxaConversao(lista.length > 0 ? (fechadas / lista.length) * 100 : 0);

    } catch (error) {
      console.error("Erro ao carregar propostas", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Ajuda a corrigir nomes de status antigos ('Fechada' vira 'FECHADO')
  const normalizarStatus = (st: string) => {
      if (!st) return 'NOVO';
      const s = st.toUpperCase();
      if (s.includes('FECHAD')) return 'FECHADO';
      if (s.includes('PERDID')) return 'PERDIDO';
      if (s.includes('ENVIAD')) return 'ENVIADO';
      if (s.includes('NEGOCIA')) return 'NEGOCIACAO';
      return 'NOVO';
  };

  useEffect(() => { loadPropostas(); }, []);

  // Mover Card e Converter Venda
  const moverCard = async (id: number, novoStatus: string) => {
    // Se for FECHADO, aciona a automação
    if (novoStatus === 'FECHADO') {
      const confirmacao = window.confirm("💰 PARABÉNS PELA VENDA!\n\nDeseja criar o contrato e o cliente automaticamente?");
      
      if (confirmacao) {
        const toastId = toast.loading("Gerando contrato...");
        try {
          const res = await api.propostas.converter(id);
          toast.success("Venda realizada! Redirecionando...", { id: toastId });
          setTimeout(() => navigate(`/consumidores/${res.consumidor_id}`), 1500);
          return;
        } catch (error) {
          toast.error("Erro ao converter venda.", { id: toastId });
          return;
        }
      }
    }

    // Atualização normal de status
    try {
      setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p)); // Update Otimista
      await api.propostas.update(id, { status: novoStatus });
    } catch (e) {
      toast.error("Erro ao atualizar status");
      loadPropostas();
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    try {
      await api.propostas.delete(id);
      setPropostas(prev => prev.filter(p => p.id !== id));
      toast.success("Proposta excluída.");
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Filtro de Busca
  const filtered = propostas.filter(p => 
    (p.nome_cliente_prospect || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col pb-4">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Pipeline de Vendas</h2>
          <p className="text-gray-500 text-sm">Gerencie suas negociações visualmente</p>
        </div>
        <Link to="/propostas/novo" className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all font-bold">
          <Plus className="w-5 h-5" /> Nova Simulação
        </Link>
      </div>

      {/* --- KPI CARDS (Mantidos do seu código) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg"><FileText className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Propostas Ativas</p><p className="text-2xl font-black text-gray-800">{propostas.length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Potencial Mensal</p><p className="text-2xl font-black text-gray-800">{formatMoney(totalPotencial)}</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-xs text-gray-500 font-bold uppercase">Conversão</p><p className="text-2xl font-black text-gray-800">{taxaConversao.toFixed(1)}%</p></div>
        </div>
      </div>

      {/* --- BARRA DE BUSCA --- */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
        <input type="text" placeholder="Buscar cliente..." className="pl-10 w-full md:w-1/3 rounded-xl border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-3 shadow-sm bg-white" 
          value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {/* --- KANBAN BOARD --- */}
      {loading ? (
         <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="flex gap-5 min-w-[1300px] h-full">
            
            {COLUNAS.map(coluna => {
              // Filtra os cards desta coluna (respeitando a busca)
              const itensColuna = filtered.filter(p => (p.status || 'NOVO') === coluna.id);

              return (
                <div key={coluna.id} className="flex-1 flex flex-col min-w-[280px]">
                  {/* Título da Coluna */}
                  <div className={`p-3 rounded-t-xl border-b-4 bg-white shadow-sm flex justify-between items-center ${coluna.cor} border-b-current`}>
                    <span className="font-bold text-sm uppercase tracking-wide">{coluna.titulo}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{itensColuna.length}</span>
                  </div>

                  {/* Área de Drop (Lista de Cards) */}
                  <div className="bg-gray-100/50 p-2 rounded-b-xl flex-1 border border-gray-200 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin">
                    {itensColuna.map(item => {
                        const economia = item.dados_simulacao?.economiaRealCliente || item.dados_simulacao?.economiaMensal || 0;
                        return (
                          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative animate-fade-in-up">
                            
                            {/* Topo do Card */}
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-gray-800 text-sm truncate" title={item.nome_cliente_prospect}>
                                {item.nome_cliente_prospect}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-mono">#{item.id}</span>
                            </div>

                            {/* Informações */}
                            <div className="space-y-1.5 mb-3 bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Zap size={12} className="text-yellow-500"/>
                                <span className="truncate max-w-[150px]">{item.dados_simulacao?.usinaSelecionada?.nome || 'Usina N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-green-700 font-bold">
                                <DollarSign size={12} />
                                <span>Econ: {formatMoney(economia)}/mês</span>
                              </div>
                            </div>

                            {/* Rodapé e Ações */}
                            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                <div className="text-[10px] text-gray-400 flex items-center gap-1" title="Data de Criação">
                                  <Calendar size={10}/> {new Date(item.created_at).toLocaleDateString()}
                                </div>

                                <div className="flex gap-1">
                                    <Link to={`/propostas/${item.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Detalhes"><ExternalLink size={14}/></Link>
                                    <button onClick={() => window.open(`https://wa.me/?text=Olá ${item.nome_cliente_prospect}`, '_blank')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="WhatsApp"><MessageCircle size={14}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded" title="Excluir"><Trash2 size={14}/></button>
                                </div>
                            </div>

                            {/* Seletor de Status (Mover) */}
                            <select 
                              className="mt-2 w-full text-xs border border-gray-200 rounded p-1.5 bg-white cursor-pointer outline-none hover:border-blue-400 text-gray-600 font-medium"
                              value={item.status}
                              onChange={(e) => moverCard(item.id, e.target.value)}
                            >
                              <option disabled>Mover para...</option>
                              {COLUNAS.map(c => (
                                <option key={c.id} value={c.id}>{c.titulo.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')}</option>
                              ))}
                            </select>

                          </div>
                        );
                    })}
                    
                    {itensColuna.length === 0 && (
                      <div className="text-center py-12 opacity-30">
                        <ListFilter className="w-8 h-8 mx-auto mb-2"/>
                        <p className="text-xs">Vazio</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}