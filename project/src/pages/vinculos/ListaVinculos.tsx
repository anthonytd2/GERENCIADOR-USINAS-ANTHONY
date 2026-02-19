import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Plus, Search, Zap, User, ArrowRight, CheckCircle, XCircle, 
  Link as LinkIcon, Trash2, Activity,
  AlertTriangle, Share2, Calendar, Clock
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { VinculoDetalhado } from '../../types';

export default function ListaVinculos() {
  const [vinculos, setVinculos] = useState<VinculoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  
  // FILTRO: Agrupa os status do banco em categorias lógicas
  const [filtro, setFiltro] = useState<'todos' | 'ATIVOS' | 'PENDENTES' | 'ENCERRADOS'>('todos');
  const [busca, setBusca] = useState('');

  // Modais
  const [modalAberto, setModalAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  
  // KPIs
  const [stats, setStats] = useState({ total: 0, ativos: 0, pendentes: 0 });

  const loadVinculos = () => {
    setLoading(true);
    api.vinculos.list()
      .then((data: any) => {
        const lista = Array.isArray(data) ? data : [];
        setVinculos(lista);

        // Calcular KPIs baseados nos textos do banco
        const total = lista.length;
        const ativos = lista.filter((v: any) => v.status?.descricao?.toUpperCase().includes('ATIVO')).length;
        const pendentes = lista.filter((v: any) => {
           const s = v.status?.descricao?.toUpperCase() || '';
           return s.includes('PENDENTE') || s.includes('AGUARDANDO') || s.includes('TROCA');
        }).length;

        setStats({ total, ativos, pendentes });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVinculos();
  }, []);

  const solicitarExclusao = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdParaExcluir(id);
    setModalAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await api.vinculos.delete(idParaExcluir);
      toast.success('Vínculo excluído com sucesso!');
      loadVinculos();
    } catch (error) {
      toast.error('Erro ao excluir vínculo.');
    } finally {
      setModalAberto(false);
      setIdParaExcluir(null);
    }
  };

  // Helper de Data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    // Corrige fuso horário simples adicionando T12:00:00 se vier só data YYYY-MM-DD
    const datePart = dateString.split('T')[0]; 
    const [ano, mes, dia] = datePart.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Lógica de Cores baseada nos seus status do banco
  const getStatusConfig = (statusDesc?: string) => {
    const s = statusDesc?.toUpperCase() || '';
    
    if (s.includes('ATIVO')) {
       return { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle };
    }
    if (s.includes('ENCERRADO')) {
       return { style: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle };
    }
    if (s.includes('AGUARDANDO')) {
       return { style: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock };
    }
    if (s.includes('TROCA')) {
       return { style: 'bg-purple-100 text-purple-700 border-purple-200', icon: Activity };
    }
    // Pendente / Observação / Outros
    return { style: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle };
  };

  // FILTRAGEM
  const vinculosFiltrados = vinculos.filter(v => {
    // 1. Filtro por Abas (Status)
    const s = v.status?.descricao?.toUpperCase() || '';
    let passaFiltroStatus = true;

    if (filtro === 'ATIVOS') {
        passaFiltroStatus = s.includes('ATIVO');
    } else if (filtro === 'ENCERRADOS') {
        passaFiltroStatus = s.includes('ENCERRADO');
    } else if (filtro === 'PENDENTES') {
        passaFiltroStatus = s.includes('PENDENTE') || s.includes('AGUARDANDO') || s.includes('TROCA');
    }

    // 2. Filtro por Busca (Nome)
    const nomeUsina = (v.usinas?.nome || '').toLowerCase();
    const nomeConsumidor = (v.consumidores?.nome || '').toLowerCase();
    const termo = busca.toLowerCase();
    const passaBusca = nomeUsina.includes(termo) || nomeConsumidor.includes(termo);

    return passaFiltroStatus && passaBusca;
  });

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">
      
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
            <Share2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Alocações de Energia
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Gerencie a conexão (1 para 1) entre suas Usinas e Consumidores.
            </p>
          </div>
        </div>

        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Vínculo
        </Link>
      </div>

      {/* 2. KPIs RÁPIDOS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total de Vínculos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Ativos (Injetando)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ativos}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Pendentes / Análise</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTROS E BUSCA */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por usina ou consumidor..."
            className="w-full pl-12 pr-4 py-2.5 bg-transparent font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl w-full md:w-auto overflow-x-auto">
          {/* Botões de Filtro */}
          {[
             { label: 'Todos', val: 'todos' },
             { label: 'Ativos', val: 'ATIVOS' },
             { label: 'Pendentes', val: 'PENDENTES' },
             { label: 'Encerrados', val: 'ENCERRADOS' }
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setFiltro(item.val as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${
                filtro === item.val 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LISTA DE VÍNCULOS */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : vinculosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <LinkIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum vínculo encontrado</h3>
          <p className="text-gray-500 text-sm mt-1">
             Verifique o filtro selecionado ou crie um novo vínculo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {vinculosFiltrados.map((v) => {
             const statusConfig = getStatusConfig(v.status?.descricao);
             const StatusIcon = statusConfig.icon;
             
             return (
              <Link 
                to={`/vinculos/${v.id}`} 
                key={v.id}
                className="group bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col md:flex-row items-center gap-6 relative"
              >
                
                {/* DATA DE VIGÊNCIA NO TOPO */}
                <div className="absolute top-4 right-4 text-[10px] text-gray-400 font-medium flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                   <Calendar size={10} /> Início: {formatDate(v.data_inicio)}
                </div>

                {/* COLUNA 1: USINA */}
                <div className="flex items-center gap-4 min-w-[220px] w-full md:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center shadow-sm flex-shrink-0">
                    <Zap className="w-6 h-6 fill-yellow-700" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Usina Geradora</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                      {v.usinas?.nome || 'Usina Desconhecida'}
                    </h3>
                  </div>
                </div>

                {/* COLUNA 2: STATUS */}
                <div className="flex-1 flex flex-col items-center justify-center w-full md:w-auto my-2 md:my-0">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-1.5 ${statusConfig.style}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {v.status?.descricao || 'Indefinido'}
                    </div>
                </div>

                {/* COLUNA 3: CONSUMIDOR */}
                <div className="flex items-center gap-4 min-w-[220px] w-full md:w-auto justify-end text-right">
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Consumidor (UC)</p>
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {v.consumidores?.nome || 'Cliente Desconhecido'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm flex-shrink-0">
                    <User className="w-6 h-6 fill-blue-700" />
                  </div>
                </div>

                {/* AÇÕES (Hover) */}
                <div className="hidden md:flex items-center gap-2 border-l pl-4 ml-2 border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => solicitarExclusao(v.id, e)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="text-gray-300 group-hover:text-indigo-500 p-2">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

              </Link>
             );
          })}
        </div>
      )}

      {/* Modal de Confirmação */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Encerrar Vínculo"
        message="Tem certeza que deseja excluir este vínculo? O histórico financeiro poderá ser perdido."
        isDestructive={true}
        confirmText="Sim, Excluir Definitivamente"
      />
    </div>
  );
}