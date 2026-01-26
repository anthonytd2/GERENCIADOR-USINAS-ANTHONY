import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Plus,
  Search,
  Zap,
  User,
  ArrowRight,
  CheckCircle,
  XCircle,
  BarChart3,
  Link as LinkIcon,
  Trash2,
  Activity,
  Calendar,
  AlertTriangle,
  FileText
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

        // Calcular KPIs (Considerando Status real)
        const ativos = lista.filter(v => {
          const s = v.status?.descricao?.toLowerCase() || '';
          return s.includes('ativo') || s.includes('injetando') || s.includes('troca');
        }).length;

        const somaPercentual = lista.reduce((acc, curr) => acc + (Number(curr.percentual) || 0), 0);

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

  const solicitarExclusao = (id: number) => {
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

  // --- FUNÇÃO AUXILIAR PARA COR E ÍCONE DO STATUS ---
  const getStatusBadge = (statusDesc?: string) => {
    const s = statusDesc?.toLowerCase() || '';

    if (s.includes('ativo') || s.includes('injetando')) {
      return { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: statusDesc };
    }
    if (s.includes('encerrado') || s.includes('cancelado')) {
      return { style: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle, label: statusDesc };
    }
    if (s.includes('divergência') || s.includes('divergencia')) {
      return { style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: statusDesc };
    }
    if (s.includes('troca') || s.includes('análise') || s.includes('pendente')) {
      return { style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity, label: statusDesc };
    }
    if (s.includes('aguardando')) {
      return { style: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar, label: statusDesc };
    }
    // Padrão
    return { style: 'bg-gray-100 text-gray-600 border-gray-200', icon: FileText, label: statusDesc || 'Indefinido' };
  };

  const filtrados = vinculos.filter(v =>
    (v.usinas?.nome_proprietario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (v.consumidores?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Alocações de Energia</h2>
          <p className="text-gray-500 mt-1">Gerencie a injeção de créditos (Conexão Usina x Consumidor)</p>
        </div>
        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-6 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </Link>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Alocações</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Alocações Ativas/Em Processo</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ativos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Média de Alocação</p>
            <p className="text-2xl font-bold text-gray-900">{stats.mediaPercentual}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* BARRA DE BUSCA */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por usina ou consumidor..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* TABELA */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <LinkIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum contrato encontrado</h3>
            <p className="text-gray-500 max-w-sm mt-1">Crie um novo vínculo para começar a gerenciar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usina (Gerador)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Alocação</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente (Consumidor)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtrados.map((v) => {

                  // Identifica o status visual correto
                  const statusConfig = getStatusBadge(v.status?.descricao);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={v.vinculo_id} className="hover:bg-blue-50/30 transition-colors group">

                      {/* COLUNA USINA */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-yellow-100 text-yellow-700 rounded-lg shadow-sm">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              to={`/usinas/${v.usinas?.usina_id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline block text-base"
                            >
                              {v.usinas?.nome_proprietario || 'N/D'}
                            </Link>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                              {v.usinas?.tipo || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA PERCENTUAL */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="text-lg font-black text-slate-700">
                            {v.percentual}%
                          </div>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(v.percentual, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA CONSUMIDOR */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              to={`/consumidores/${v.consumidores?.consumidor_id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline block text-base"
                            >
                              {v.consumidores?.nome || 'N/D'}
                            </Link>
                            {v.consumidores?.cidade && (
                              <div className="text-xs text-gray-500 mt-1">
                                {v.consumidores.cidade}/{v.consumidores.uf}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUNA STATUS (AGORA DINÂMICA) */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${statusConfig.style}`}>
                          <StatusIcon className="w-3 h-3 mr-1.5" />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            to={`/vinculos/${v.vinculo_id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"
                          >
                            Detalhes <ArrowRight className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => solicitarExclusao(v.vinculo_id)}
                            className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                            title="Excluir Vínculo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Componente Modal */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Encerrar Vínculo"
        message="Tem certeza que deseja excluir este vínculo? O histórico financeiro poderá ser perdido."
        isDestructive={true}
        confirmText="Sim, Excluir"
      />
    </div>
  );
}