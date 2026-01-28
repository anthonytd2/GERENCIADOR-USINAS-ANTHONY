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
  ListFilter,
  MoreHorizontal
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
    usinaSelecionada?: { nome_proprietario?: string; nome?: string }; 
    consumoMedia?: number;
    consumoKwh?: number;
    economiaEstimada?: number;
    economiaMensal?: number;
    economiaRealCliente?: number;
  };
}

// Configuração Visual das Colunas (Design Premium)
const COLUNAS = [
  { 
    id: 'NOVO', 
    titulo: 'Novos Leads', 
    cor: 'border-t-4 border-blue-500 bg-gradient-to-b from-blue-50/80 to-slate-50/50', 
    texto: 'text-blue-900', 
    badge: 'bg-blue-100 text-blue-700' 
  },
  { 
    id: 'ENVIADO', 
    titulo: 'Proposta Enviada', 
    cor: 'border-t-4 border-amber-500 bg-gradient-to-b from-amber-50/80 to-slate-50/50', 
    texto: 'text-amber-900', 
    badge: 'bg-amber-100 text-amber-700' 
  },
  { 
    id: 'NEGOCIACAO', 
    titulo: 'Em Negociação', 
    cor: 'border-t-4 border-purple-500 bg-gradient-to-b from-purple-50/80 to-slate-50/50', 
    texto: 'text-purple-900', 
    badge: 'bg-purple-100 text-purple-700' 
  },
  { 
    id: 'FECHADO', 
    titulo: 'Fechado', 
    cor: 'border-t-4 border-emerald-500 bg-gradient-to-b from-emerald-50/80 to-slate-50/50', 
    texto: 'text-emerald-900', 
    badge: 'bg-emerald-100 text-emerald-700' 
  },
  { 
    id: 'PERDIDO', 
    titulo: 'Perdido', 
    cor: 'border-t-4 border-slate-400 bg-gradient-to-b from-slate-100/80 to-slate-50/50', 
    texto: 'text-slate-700', 
    badge: 'bg-slate-200 text-slate-600' 
  }
];

export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  // KPIs
  const [totalPotencial, setTotalPotencial] = useState(0);
  const [taxaConversao, setTaxaConversao] = useState(0);

  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getEconomia = (p: Proposta) => {
    const d = p.dados_simulacao || {};
    const valor = d.economiaEstimada || d.economiaMensal || d.economiaRealCliente;
    if (!valor) {
       const consumo = d.consumoMedia || d.consumoKwh || 0;
       return consumo * 0.10;
    }
    return Number(valor);
  };

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

      const total = listaNormalizada.reduce((acc: number, p: any) => acc + getEconomia(p), 0);
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

  const moverCard = async (id: number, novoStatus: string) => {
    if (novoStatus === 'FECHADO') {
      const confirmacao = window.confirm("💰 PARABÉNS PELA VENDA!\n\nDeseja cadastrar este cliente automaticamente?");
      if (confirmacao) {
        const toastId = toast.loading("Processando venda...");
        try {
          const res = await api.propostas.converter(id);
          toast.success("Cliente criado!", { id: toastId });
          setTimeout(() => navigate(`/consumidores/${res.consumidor_id}`), 1500);
          return;
        } catch (error) {
          toast.error("Erro ao converter.", { id: toastId });
          return;
        }
      }
    }

    try {
      setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p)); 
      await api.propostas.update(id, { status: novoStatus });
    } catch (e) {
      toast.error("Erro ao salvar");
      loadPropostas(); 
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
    <div className="h-full flex flex-col pb-4 font-sans bg-white">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1 pt-2">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Pipeline de Vendas</h2>
          <p className="text-slate-500 text-lg mt-1 font-medium">Acompanhe suas negociações em tempo real.</p>
        </div>
        <Link to="/propostas/novo" className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold text-lg">
          <Plus className="w-6 h-6" /> Nova Simulação
        </Link>
      </div>

      {/* --- KPI CARDS (BEM MAIORES) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6">
          <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl"><FileText className="w-10 h-10" /></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Propostas Ativas</p><p className="text-4xl font-black text-slate-800">{propostas.length}</p></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6">
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-10 h-10" /></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Potencial Mensal</p><p className="text-4xl font-black text-slate-800">{formatMoney(totalPotencial)}</p></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex items-center gap-6">
          <div className="p-5 bg-purple-50 text-purple-600 rounded-2xl"><TrendingUp className="w-10 h-10" /></div>
          <div><p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Conversão</p><p className="text-4xl font-black text-slate-800">{taxaConversao.toFixed(0)}%</p></div>
        </div>
      </div>

      {/* --- BARRA DE BUSCA --- */}
      <div className="mb-8 relative px-1">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><Search className="h-6 w-6 text-slate-400" /></div>
        <input type="text" placeholder="Buscar cliente por nome..." className="pl-14 w-full md:w-1/3 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 py-4 shadow-sm bg-white text-lg transition-all" 
          value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {/* --- KANBAN BOARD (ESTILO PREMIUM) --- */}
      {loading ? (
         <div className="p-6 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 px-1">
          <div className="flex gap-8 min-w-[1600px] h-full">
            
            {COLUNAS.map(coluna => {
              const itensColuna = filtered.filter(p => (p.status || 'NOVO') === coluna.id);
              const totalColuna = itensColuna.reduce((acc, item) => acc + getEconomia(item), 0);

              return (
                <div key={coluna.id} className="flex-1 flex flex-col min-w-[320px] rounded-3xl bg-slate-50/50">
                  
                  {/* Título da Coluna + Totalizador */}
                  <div className={`p-6 rounded-t-3xl shadow-sm flex flex-col gap-3 ${coluna.cor}`}>
                    <div className="flex justify-between items-center">
                        <span className={`font-bold text-lg tracking-tight ${coluna.texto}`}>{coluna.titulo}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${coluna.badge}`}>{itensColuna.length}</span>
                    </div>
                    
                    {/* TOTAL GRANDE */}
                    {totalColuna >= 0 && (
                        <div className={`text-3xl font-black flex items-center gap-1 mt-1 ${coluna.texto}`}>
                           <span className="text-sm opacity-60 font-medium mt-2">R$</span> {totalColuna.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    )}
                  </div>

                  {/* Lista de Cards */}
                  <div className="p-4 rounded-b-3xl flex-1 space-y-4 overflow-y-auto max-h-[650px] scrollbar-thin">
                    {itensColuna.map(item => {
                        const economia = getEconomia(item);
                        const usinaNome = item.dados_simulacao?.usinaSelecionada?.nome_proprietario 
                                       || item.dados_simulacao?.usinaSelecionada?.nome 
                                       || 'Usina N/A';

                        return (
                          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">
                            
                            {/* Topo do Card */}
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2" title={item.nome_cliente_prospect}>
                                {item.nome_cliente_prospect || 'Cliente Sem Nome'}
                              </h4>
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">#{item.id}</span>
                            </div>

                            {/* Informações */}
                            <div className="space-y-3 mb-5">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Zap size={16} className="text-amber-500 fill-amber-500"/>
                                <span className="truncate">{usinaNome}</span>
                              </div>
                              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <span className="text-xs font-bold text-emerald-600 uppercase">Economia</span>
                                <div className="flex items-center gap-1 text-lg font-black text-emerald-700">
                                  <span className="text-sm font-medium">R$</span>{formatMoney(economia).replace('R$', '')}
                                </div>
                              </div>
                            </div>

                            {/* Rodapé e Ações */}
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5" title="Data de Criação">
                                  <Calendar size={14}/> {new Date(item.created_at).toLocaleDateString()}
                                </div>

                                <div className="flex gap-2">
                                    <Link to={`/propostas/${item.id}`} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Ver Detalhes"><ExternalLink size={18}/></Link>
                                    <button onClick={() => window.open(`https://wa.me/?text=Olá ${item.nome_cliente_prospect}, segue sua proposta de energia solar!`, '_blank')} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors" title="WhatsApp"><MessageCircle size={18}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir"><Trash2 size={18}/></button>
                                </div>
                            </div>

                            {/* Seletor de Status (Estilo Botão) */}
                            <div className="mt-4 relative group/select">
                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <MoreHorizontal size={16} className="text-slate-400 group-hover/select:text-blue-500 transition-colors"/>
                              </div>
                              <select 
                                className="w-full text-sm font-bold border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 hover:bg-white text-slate-600 appearance-none transition-all"
                                value={item.status}
                                onChange={(e) => moverCard(item.id, e.target.value)}
                              >
                                <option disabled>Mover proposta para...</option>
                                {COLUNAS.map(c => (
                                  <option key={c.id} value={c.id}>{c.titulo}</option>
                                ))}
                              </select>
                            </div>

                          </div>
                        );
                    })}
                    
                    {itensColuna.length === 0 && (
                      <div className="text-center py-20 opacity-40">
                        <ListFilter className="w-12 h-12 mx-auto mb-3 text-slate-300"/>
                        <p className="text-base font-medium text-slate-400">Nenhuma proposta aqui</p>
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