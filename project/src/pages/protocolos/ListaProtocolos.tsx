import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { api } from '../../lib/api';
import { 
  Plus, Calendar, AlertCircle, CheckCircle, Clock, 
  Trash2, FileText, Search, AlertTriangle, Edit3, X 
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- CONFIGURAÇÃO DE CORES (Bordas Completas e Fortes) ---
const COLUNAS = [
  { 
    id: 'A_FAZER', 
    titulo: 'A Fazer', 
    cor: 'border-2 border-slate-400 bg-slate-50' 
  },
  { 
    id: 'PROCESSANDO', 
    titulo: 'Montando Processo', 
    cor: 'border-2 border-gray-500 bg-gray-50' 
  },
  { 
    id: 'PROTOCOLADO', 
    titulo: 'Protocolado', 
    cor: 'border-2 border-blue-600 bg-blue-50' 
  },
  { 
    id: 'PENDENCIA', 
    titulo: 'Com Pendência', 
    cor: 'border-2 border-red-600 bg-red-50' 
  },
  { 
    id: 'CONCLUIDO', 
    titulo: 'Concluído', 
    cor: 'border-2 border-emerald-600 bg-emerald-50' 
  }
];

export default function ListaProtocolos() {
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    id: 0,
    titulo: '',
    cliente: '',
    numero_protocolo: '',
    data_limite: '',
    descricao: ''
  });

  useEffect(() => {
    carregarProtocolos();
  }, []);

  const carregarProtocolos = async () => {
    setLoading(true);
    try {
      const data = await api.protocolos.list();
      setProtocolos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar protocolos');
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO PARA COR DAS BOLINHAS (BADGES) ---
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'A_FAZER': return 'bg-slate-600';     
      case 'PROCESSANDO': return 'bg-gray-700';  
      case 'PROTOCOLADO': return 'bg-blue-700';  
      case 'PENDENCIA': return 'bg-red-700';     
      case 'CONCLUIDO': return 'bg-emerald-700'; 
      default: return 'bg-slate-600';            
    }
  };

  // --- SEMÁFORO DE PRAZOS ---
  const getStatusPrazo = (dataLimite: string, status: string) => {
    if (status === 'CONCLUIDO') return { style: 'border-l-4 border-emerald-500 bg-gray-50-card text-emerald-700', icon: CheckCircle, label: 'Finalizado' };
    if (!dataLimite) return { style: 'border-l-4 border-slate-200 bg-gray-50-card text-slate-400', icon: Calendar, label: 'S/ Prazo' };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(dataLimite);
    limite.setHours(0, 0, 0, 0);

    const diffDias = (limite.getTime() - hoje.getTime()) / (1000 * 3600 * 24);

    if (diffDias < 0) return { style: 'border-l-4 border-red-500 bg-red-50 text-red-700 font-bold', icon: AlertCircle, label: 'VENCIDO' };
    if (diffDias <= 2) return { style: 'border-l-4 border-amber-500 bg-amber-50 text-amber-600 font-bold', icon: AlertTriangle, label: 'Vence Logo' };
    
    return { style: 'border-l-4 border-blue-300 bg-gray-50-card text-blue-600', icon: Clock, label: new Date(dataLimite).toLocaleDateString('pt-BR') };
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const novoStatus = destination.droppableId;
    const id = Number(draggableId);

    const novosProtocolos = protocolos.map(p => 
      p.id === id ? { ...p, status: novoStatus } : p
    );
    setProtocolos(novosProtocolos);

    try {
      await api.protocolos.update(id, { status: novoStatus });
    } catch (error) {
      toast.error('Erro ao mover card');
      carregarProtocolos();
    }
  };

  // --- MODAIS ---
  const handleNovo = () => {
    setIsEditing(false);
    setFormData({ id: 0, titulo: '', cliente: '', numero_protocolo: '', data_limite: '', descricao: '' });
    setModalOpen(true);
  };

  const handleEditar = (card: any) => {
    setIsEditing(true);
    setFormData({
      id: card.id,
      titulo: card.titulo,
      cliente: card.cliente || '',
      numero_protocolo: card.numero_protocolo || '',
      data_limite: card.data_limite || '',
      descricao: card.descricao || ''
    });
    setModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo) return toast.error('Título é obrigatório');

    try {
      if (isEditing) {
        await api.protocolos.update(formData.id, formData);
        toast.success('Protocolo atualizado!');
      } else {
        await api.protocolos.create(formData);
        toast.success('Protocolo criado!');
      }
      setModalOpen(false);
      carregarProtocolos();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleExcluir = async (id: number) => {
    if(!confirm('Excluir este protocolo?')) return;
    try {
      await api.protocolos.delete(id);
      setProtocolos(prev => prev.filter(p => p.id !== id));
      toast.success('Excluído');
      if (modalOpen) setModalOpen(false);
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="h-full flex flex-col pb-4 animate-fade-in-down">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <FileText className="text-indigo-600 w-8 h-8" /> 
            Afazeres e Protocolos
          </h1>
          <p className="text-slate-500  mt-1">Controle operacional de processos.</p>
        </div>
        <button 
          onClick={handleNovo}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Nova Atividade
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-[1500px] h-full px-1">
            {COLUNAS.map(coluna => {
              const cards = protocolos.filter(p => (p.status || 'A_FAZER') === coluna.id);
              const corBadge = getBadgeColor(coluna.id);
              
              return (
                <Droppable droppableId={coluna.id} key={coluna.id}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-w-[300px] flex flex-col rounded-xl shadow-sm h-full ${coluna.cor}`}
                    >
                      {/* Título da Coluna */}
                      <div className="p-4 border-b border-slate-200/50 flex justify-between items-center rounded-t-xl">
                        <h3 className="font-extrabold text-slate-800 uppercase text-sm tracking-wide">{coluna.titulo}</h3>
                        <span className={`${corBadge} text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm`}>
                          {cards.length}
                        </span>
                      </div>

                      {/* Lista de Cards */}
                      <div className="p-3 flex-1 overflow-y-auto space-y-3">
                        {cards.map((card, index) => {
                          const prazo = getStatusPrazo(card.data_limite, card.status);
                          const PrazoIcon = prazo.icon;
                          const corBolinhaCliente = getBadgeColor(card.status || 'A_FAZER'); 

                          return (
                            <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleEditar(card)}
                                  style={{ ...provided.draggableProps.style }}
                                  className={`
                                    p-5 rounded-xl shadow-sm cursor-pointer group relative transition-all duration-200 border border-slate-100 bg-gray-50-card
                                    hover:shadow-sm hover:border-indigo-300 hover:-translate-y-1
                                    ${prazo.style} 
                                    ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1 z-50 ring-2 ring-indigo-400' : ''}
                                  `}
                                >
                                  {/* Cliente */}
                                  {card.cliente && (
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${corBolinhaCliente}`}></span> {card.cliente}
                                    </p>
                                  )}

                                  {/* Título */}
                                  <h4 className="font-bold text-slate-800 text-sm leading-snug mb-3 pr-6">
                                    {card.titulo}
                                  </h4>

                                  {/* Descrição */}
                                  {card.descricao && (
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed ">
                                      {card.descricao}
                                    </p>
                                  )}

                                  {/* Rodapé */}
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                                    {/* Nº Protocolo */}
                                    {card.numero_protocolo ? (
                                      <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-600 border border-slate-200">
                                        #{card.numero_protocolo}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-300 italic">S/ Protocolo</div>
                                    )}

                                    {/* Prazo */}
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                      <PrazoIcon size={14} />
                                      <span className="uppercase">{prazo.label}</span>
                                    </div>
                                  </div>

                                  {/* Editar */}
                                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600">
                                    <Edit3 size={16} />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* --- MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in">
          <div className="bg-gray-50-card rounded-lg shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            {/* Cabeçalho */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {isEditing ? <Edit3 className="text-indigo-600" /> : <Plus className="text-indigo-600" />}
                {isEditing ? 'Editar Protocolo' : 'Novo Protocolo'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvar} className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título da Tarefa <span className="text-red-500">*</span></label>
                <input 
                  autoFocus
                  required
                  placeholder="Ex: Troca de Titularidade - Usina X"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all "
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cliente / Usina</label>
                  <input 
                    placeholder="Nome do cliente..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    value={formData.cliente}
                    onChange={e => setFormData({...formData, cliente: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nº Protocolo</label>
                  <input 
                    placeholder="Ex: 2026.12345"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono"
                    value={formData.numero_protocolo}
                    onChange={e => setFormData({...formData, numero_protocolo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex justify-between">
                  Prazo Limite
                  <span className="text-xs font-normal text-slate-400">Opcional</span>
                </label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all  text-slate-700"
                  value={formData.data_limite}
                  onChange={e => setFormData({...formData, data_limite: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição & Observações</label>
                <textarea 
                  rows={4}
                  placeholder="Descreva detalhes, pendências ou anotações importantes..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm leading-relaxed"
                  value={formData.descricao}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => handleExcluir(formData.id)}
                    className="px-4 py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <div className="flex-1 flex gap-3 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)} 
                    className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Criar Protocolo'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}