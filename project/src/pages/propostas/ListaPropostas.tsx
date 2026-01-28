import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, Search, DollarSign, TrendingUp, FileText, Calendar, Zap, MessageCircle, ExternalLink, Trash2, ListFilter, X, Check, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- INTERFACES ---
interface Proposta {
  id: number;
  nome_cliente_prospect: string;
  status: string;
  created_at: string;
  updated_at?: string; // Novo campo para o relógio funcionar
  dados_simulacao: {
    usinaSelecionada?: { nome_proprietario?: string; nome?: string }; 
    consumoMedia?: number;
    consumoKwh?: number;
    economiaEstimada?: number;
    economiaMensal?: number;
    economiaRealCliente?: number;
  };
}

// --- CONFIGURAÇÃO VISUAL DAS COLUNAS ---
const COLUNAS = [
  { id: 'NOVO', titulo: 'Novos Leads', cor: 'border-t-4 border-blue-500 bg-gradient-to-b from-blue-50/80 to-slate-50/50', texto: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  { id: 'ENVIADO', titulo: 'Enviado', cor: 'border-t-4 border-amber-500 bg-gradient-to-b from-amber-50/80 to-slate-50/50', texto: 'text-amber-900', badge: 'bg-amber-100 text-amber-700' },
  { id: 'NEGOCIACAO', titulo: 'Negociação', cor: 'border-t-4 border-purple-500 bg-gradient-to-b from-purple-50/80 to-slate-50/50', texto: 'text-purple-900', badge: 'bg-purple-100 text-purple-700' },
  { id: 'FECHADO', titulo: 'Fechado', cor: 'border-t-4 border-emerald-500 bg-gradient-to-b from-emerald-50/80 to-slate-50/50', texto: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'PERDIDO', titulo: 'Perdido', cor: 'border-t-4 border-slate-400 bg-gradient-to-b from-slate-100/80 to-slate-50/50', texto: 'text-slate-700', badge: 'bg-slate-200 text-slate-600' }
];

// --- COMPONENTE PRINCIPAL ---
export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Estado para o Modal de Confirmação Bonito
  const [modalVendaOpen, setModalVendaOpen] = useState(false);
  const [propostaParaConverter, setPropostaParaConverter] = useState<number | null>(null);

  const navigate = useNavigate();

  // KPIs Calculados em Tempo Real
  const totalPotencial = propostas.reduce((acc, p) => acc + getEconomia(p), 0);
  const fechadasCount = propostas.filter(p => p.status === 'FECHADO').length;
  const taxaConversao = propostas.length > 0 ? (fechadasCount / propostas.length) * 100 : 0;

  function formatMoney(v: number) {
     return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  function getEconomia(p: Proposta) {
    const d = p.dados_simulacao || {};
    const valor = d.economiaEstimada || d.economiaMensal || d.economiaRealCliente;
    if (!valor) {
       const consumo = d.consumoMedia || d.consumoKwh || 0;
       return consumo * 0.10;
    }
    return Number(valor);
  }

  // --- NOVO: LÓGICA DO RELÓGIO (AGING) ---
  function getTempoNaEtapa(dataStr?: string) {
    if (!dataStr) return { texto: 'Recente', cor: 'bg-emerald-100 text-emerald-700' };
    
    const data = new Date(dataStr);
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - data.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 2) return { texto: 'Recente', cor: 'bg-emerald-100 text-emerald-700' };
    if (diffDays <= 7) return { texto: `${diffDays}d na etapa`, cor: 'bg-amber-100 text-amber-700' };
    return { texto: `${diffDays}d travado`, cor: 'bg-red-100 text-red-700 font-bold' };
  }

  const loadPropostas = async () => {
    setLoading(true);
    try {
      const data = await api.propostas.list().catch(() => []);
      const lista = Array.isArray(data) ? data : (data.data || []);
      
      const listaNormalizada = lista.map((p: any) => ({
          ...p,
          status: normalizarStatus(p.status)
      }));
      setPropostas(listaNormalizada);
    } catch (error) {
      console.error("Erro ao carregar", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

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

  // --- LÓGICA DO ARRASTAR E SOLTAR ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const novoStatus = destination.droppableId;
    const propostaId = Number(draggableId);

    // 1. Atualiza visualmente na hora (+ Atualiza a data updated_at para AGORA)
    const propostasAtualizadas = propostas.map(p => 
      p.id === propostaId ? { ...p, status: novoStatus, updated_at: new Date().toISOString() } : p
    );
    setPropostas(propostasAtualizadas);

    // 2. Se for FECHADO, abre o Modal
    if (novoStatus === 'FECHADO') {
      setPropostaParaConverter(propostaId);
      setModalVendaOpen(true);
    }

    // 3. Salva no Banco
    try {
      await api.propostas.update(propostaId, { status: novoStatus });
    } catch (e) {
      toast.error("Erro ao salvar mudança");
      loadPropostas(); 
    }
  };

  const handleConverterVenda = async () => {
    if (!propostaParaConverter) return;
    setModalVendaOpen(false); 
    const toastId = toast.loading("Gerando contrato e cliente...");
    try {
      const res = await api.propostas.converter(propostaParaConverter);
      toast.success("Venda convertida com sucesso!", { id: toastId });
      setTimeout(() => navigate(`/consumidores/${res.consumidor_id}`), 1000);
    } catch (error) {
      toast.error("Erro ao converter venda.", { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Excluir proposta?')) return;
    try {
      await api.propostas.delete(id);
      setPropostas(prev => prev.filter(p => p.id !== id));
      toast.success("Excluída.");
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const filtered = propostas.filter(p => 
    (p.nome_cliente_prospect || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col pb-4 font-sans bg-white relative">
      
      {/* --- MODAL DE VENDA --- */}
      {modalVendaOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all">
            <div className="bg-emerald-600 p-6 text-center">
              <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Parabéns pela Venda! 🚀</h3>
              <p className="text-emerald-100 mt-1">O cliente aceitou a proposta?</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-center">
                Deseja cadastrar este cliente automaticamente no sistema para gerar o contrato agora?
              </p>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setModalVendaOpen(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Apenas Mover Card
                </button>
                <button 
                  onClick={handleConverterVenda}
                  className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" /> Sim, Gerar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-1 pt-2">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pipeline de Vendas</h2>
          <p className="text-slate-500 text-base mt-1 font-medium">Gestão visual de negociações.</p>
        </div>
        <Link to="/propostas/novo" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-bold text-base">
          <Plus className="w-5 h-5" /> Nova Simulação
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-8 h-8" /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Propostas Ativas</p><p className="text-3xl font-black text-slate-800">{propostas.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="w-8 h-8" /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Potencial Mensal</p><p className="text-3xl font-black text-slate-800">{formatMoney(totalPotencial)}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-5">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp className="w-8 h-8" /></div>
          <div><p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Conversão</p><p className="text-3xl font-black text-slate-800">{taxaConversao.toFixed(0)}%</p></div>
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="mb-6 relative px-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-slate-400" /></div>
        <input type="text" placeholder="Buscar cliente..." className="pl-12 w-full md:w-1/3 rounded-xl border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 py-3 shadow-sm bg-white text-base transition-all" 
          value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {/* --- KANBAN DRAG AND DROP --- */}
      {loading ? (
         <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto pb-4 px-1">
            <div className="flex gap-6 min-w-[1500px] h-full">
              
              {COLUNAS.map(coluna => {
                const itensColuna = filtered.filter(p => (p.status || 'NOVO') === coluna.id);
                const totalColuna = itensColuna.reduce((acc, item) => acc + getEconomia(item), 0);

                return (
                  <Droppable droppableId={coluna.id} key={coluna.id}>
                    {(provided) => (
                      <div 
                        className="flex-1 flex flex-col min-w-[280px] rounded-2xl bg-slate-50/50"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {/* Título da Coluna */}
                        <div className={`p-4 rounded-t-2xl shadow-sm flex flex-col gap-2 ${coluna.cor}`}>
                          <div className="flex justify-between items-center">
                              <span className={`font-bold text-base tracking-tight ${coluna.texto}`}>{coluna.titulo}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${coluna.badge}`}>{itensColuna.length}</span>
                          </div>
                          {totalColuna >= 0 && (
                              <div className={`text-2xl font-black flex items-center gap-1 mt-1 ${coluna.texto}`}>
                                 <span className="text-xs opacity-60 font-medium mt-1.5">R$</span> {totalColuna.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                          )}
                        </div>

                        {/* Área dos Cards */}
                        <div className="p-3 rounded-b-2xl flex-1 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin">
                          {itensColuna.map((item, index) => {
                              const economia = getEconomia(item);
                              const usinaNome = item.dados_simulacao?.usinaSelecionada?.nome_proprietario 
                                             || item.dados_simulacao?.usinaSelecionada?.nome 
                                             || 'Usina N/A';
                              
                              // Cálculo do Aging (Relógio)
                              const tempoEtapa = getTempoNaEtapa(item.updated_at || item.created_at);

                              return (
                                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{ ...provided.draggableProps.style }}
                                      className={`bg-white p-5 rounded-xl border border-slate-100 shadow-sm transition-all group relative
                                        ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-2 border-blue-300 z-50' : 'hover:shadow-md hover:-translate-y-1'}
                                      `}
                                    >
                                      
                                      <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2" title={item.nome_cliente_prospect}>
                                          {item.nome_cliente_prospect || 'Cliente Sem Nome'}
                                        </h4>
                                        {/* Relógio de Aging (Novo!) */}
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${tempoEtapa.cor}`}>
                                          <Clock size={10} /> {tempoEtapa.texto}
                                        </div>
                                      </div>

                                      <div className="space-y-2.5 mb-4">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                          <Zap size={14} className="text-amber-500 fill-amber-500"/>
                                          <span className="truncate">{usinaNome}</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                          <span className="text-[10px] font-bold text-emerald-600 uppercase">Economia</span>
                                          <div className="flex items-center gap-1 text-base font-black text-emerald-700">
                                            <span className="text-xs font-medium">R$</span>{formatMoney(economia).replace('R$', '')}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                            <Calendar size={12}/> {new Date(item.created_at).toLocaleDateString()}
                                          </div>

                                          <div className="flex gap-1.5">
                                              <Link to={`/propostas/${item.id}`} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Ver Detalhes"><ExternalLink size={16}/></Link>
                                              <button onClick={() => window.open(`https://wa.me/?text=Olá ${item.nome_cliente_prospect}`, '_blank')} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title="WhatsApp"><MessageCircle size={16}/></button>
                                              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                                          </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                          })}
                          
                          {/* Placeholder para manter o tamanho quando arrasta */}
                          {provided.placeholder}

                          {itensColuna.length === 0 && (
                            <div className="text-center py-16 opacity-40">
                              <ListFilter className="w-10 h-10 mx-auto mb-2 text-slate-300"/>
                              <p className="text-sm font-medium text-slate-400">Arraste para cá</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}