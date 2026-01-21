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
  Trash2 // <--- Verifique se adicionou este aqui
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast'; // <--- Adicionar
import ModalConfirmacao from '../../components/ModalConfirmacao'; // <--- Adicionar
import { VinculoDetalhado } from '../../types'; // Importando o tipo seguro


export default function ListaVinculos() {
  // Agora o TypeScript sabe tudo sobre 'VinculoDetalhado' vindo do arquivo types.ts
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

        // Calcular KPIs (Considerando Data)
        const hoje = new Date();
        const ativos = lista.filter(v => {
          const fim = v.data_fim ? new Date(v.data_fim) : null;
          return !fim || fim >= hoje;
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

  // 1. Abre a janela
  const solicitarExclusao = (id: number) => {
    setIdParaExcluir(id);
    setModalAberto(true);
  };

  // 2. Deleta de verdade
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

      {/* CARDS DE KPI (RESUMO) */}
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
            <p className="text-sm text-gray-500 font-medium">Alocações Ativas</p>
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
                  // --- 1. Lógica de Datas ---
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);

                  let dataFim = null;
                  if (v.data_fim) {
                    dataFim = new Date(v.data_fim);
                    dataFim.setHours(0, 0, 0, 0);
                  }

                  // --- 2. Definição das Variáveis (CORREÇÃO AQUI) ---

                  // A) Verificamos se foi cancelado (FALTAVA ESSA LINHA)
                  const isCancelado = v.status?.descricao === 'Encerrado' || v.status?.descricao === 'Cancelado';

                  // B) Verificamos se já passou da data de desligamento
                  const isDesligado = dataFim && dataFim < hoje;

                  // C) Status Final: Injetando se não cancelou e não desligou
                  const isInjetando = !isCancelado && !isDesligado;

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

                      {/* COLUNA STATUS (Corrigido: trocado isAtivo por isInjetando) */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${isInjetando
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                          {isInjetando ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1.5" /> INJETANDO
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1.5" /> DESLIGADO
                            </>
                          )}
                        </span>
                        {dataFim && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Até {dataFim.toLocaleDateString('pt-BR')}
                          </div>
                        )}
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