import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Plus, Search, Zap, User, ArrowRight, CheckCircle, XCircle, 
  BarChart3, Link as LinkIcon, Trash2, Activity,
  AlertTriangle, FileText, Share2
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { VinculoDetalhado } from '../../types';

export default function ListaVinculos() {
  const [vinculos, setVinculos] = useState<VinculoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [stats, setStats] = useState({ total: 0, ativos: 0, mediaPercentual: 0 });

  const loadVinculos = () => {
    setLoading(true);
    api.vinculos.list()
      .then((data: any) => {
        const lista = Array.isArray(data) ? data : [];
        setVinculos(lista);

        // Calcular KPIs
        const ativos = lista.filter((v: any) => {
          const s = v.status?.descricao?.toLowerCase() || '';
          return s.includes('ativo') || s.includes('injetando') || s.includes('troca');
        }).length;

        const somaPercentual = lista.reduce((acc: number, curr: any) => acc + (Number(curr.percentual) || 0), 0);

        setStats({
          total: lista.length,
          ativos: ativos,
          mediaPercentual: lista.length > 0 ? Math.round(somaPercentual / lista.length) : 0
        });
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

  // Status Visual
  const getStatusBadge = (statusDesc?: string) => {
    const s = statusDesc?.toLowerCase() || '';
    if (s.includes('ativo') || s.includes('injetando')) return { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: statusDesc };
    if (s.includes('encerrado') || s.includes('cancelado')) return { style: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle, label: statusDesc };
    if (s.includes('divergência')) return { style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: statusDesc };
    if (s.includes('troca') || s.includes('análise')) return { style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity, label: statusDesc };
    return { style: 'bg-blue-50 text-blue-700 border-blue-100', icon: FileText, label: statusDesc || 'Indefinido' };
  };

  const filtrados = vinculos.filter(v =>
    // CORREÇÃO: nome_proprietario -> nome
    (v.usinas?.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (v.consumidores?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-down pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="text-indigo-600" />
            Alocações de Energia
          </h1>
          <p className="text-gray-500 mt-1">Gerencie a conexão entre suas Usinas e Consumidores.</p>
        </div>

        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </Link>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <LinkIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Alocado</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Ativos</p>
            <p className="text-3xl font-bold text-gray-900">{stats.ativos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Média %</p>
            <p className="text-3xl font-bold text-gray-900">{stats.mediaPercentual}%</p>
          </div>
        </div>
      </div>

      {/* BARRA DE BUSCA */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por usina ou consumidor..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none font-medium"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-400 font-medium hidden md:block px-2">
          {filtrados.length} alocações
        </div>
      </div>

      {/* LISTA DE CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Share2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum vínculo encontrado</h3>
          <p className="text-gray-500 max-w-xs mt-2">Conecte uma usina a um consumidor para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtrados.map((v) => {
             const statusConfig = getStatusBadge(v.status?.descricao);
             const StatusIcon = statusConfig.icon;
             
             return (
              <Link 
                // CORREÇÃO: vinculo_id -> id
                to={`/vinculos/${v.id}`} 
                key={v.id}
                className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row items-center gap-4 md:gap-8 relative overflow-hidden"
              >
                {/* Faixa lateral decorativa */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>

                {/* COLUNA 1: USINA (ORIGEM) */}
                <div className="flex items-center gap-3 min-w-[240px] pl-2">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center shadow-sm">
                    <Zap className="w-6 h-6 fill-yellow-700" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Gerador (Usina)</p>
                    <h3 className="text-base font-bold text-gray-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">
                      {/* CORREÇÃO: nome_proprietario -> nome */}
                      {v.usinas?.nome || 'Usina Desconhecida'}
                    </h3>
                  </div>
                </div>

                {/* COLUNA 2: CONEXÃO (PERCENTUAL) */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-[120px]">
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-[2px] bg-gray-200 flex-1"></div>
                      <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-bold text-gray-700 border border-gray-200 shadow-sm whitespace-nowrap">
                        {v.percentual}% Alocado
                      </div>
                      <div className="h-[2px] bg-gray-200 flex-1 relative">
                        <ArrowRight className="w-4 h-4 text-gray-300 absolute right-0 -top-2" />
                      </div>
                    </div>
                    {/* Status Badge Abaixo da linha */}
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${statusConfig.style}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </div>
                </div>

                {/* COLUNA 3: CONSUMIDOR (DESTINO) */}
                <div className="flex items-center gap-3 min-w-[240px] justify-end text-right">
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Cliente (Consumidor)</p>
                    <h3 className="text-base font-bold text-gray-900 truncate pl-2 group-hover:text-blue-700 transition-colors">
                      {/* CORREÇÃO: nome (consumidor já usava nome, mas só confirmando) */}
                      {v.consumidores?.nome || 'Cliente Desconhecido'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6 fill-blue-700" />
                  </div>
                </div>

                {/* AÇÕES (Sempre visíveis) */}
                <div className="flex items-center gap-2 border-l pl-4 ml-2 border-gray-100">
                  <button 
                    // CORREÇÃO: vinculo_id -> id
                    onClick={(e) => solicitarExclusao(v.id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors">
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