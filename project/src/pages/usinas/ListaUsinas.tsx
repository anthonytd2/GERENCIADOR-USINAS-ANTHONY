import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, Zap, ArrowRight, Sun, Search, CheckCircle, XCircle } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { Usina } from '../../types';

export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'disponiveis' | 'locadas'>('todos');

  // NOVO: Estado para a busca por nome
  const [busca, setBusca] = useState('');

  // Controle de Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const loadUsinas = () => {
    setLoading(true);
    api.usinas.list()
      .then((data: any) => {
        setUsinas(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsinas();
  }, []);

  // Lógica de Exclusão
  const solicitarExclusao = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIdParaExcluir(id);
    setModalAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await api.usinas.delete(idParaExcluir);
      toast.success('Usina excluída com sucesso!');
      loadUsinas();
    } catch (error) {
      toast.error('Erro ao excluir usina. Verifique se há vínculos.');
    } finally {
      setModalAberto(false);
      setIdParaExcluir(null);
    }
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // --- FILTRO INTELIGENTE (STATUS + BUSCA POR NOME) ---
  const usinasFiltradas = usinas.filter(u => {
    // 1. Filtra por Status (Abas)
    const passaFiltroStatus =
      filtro === 'todos' ? true :
        filtro === 'disponiveis' ? !u.is_locada :
          filtro === 'locadas' ? u.is_locada : true;

    // 2. Filtra por Nome (Barra de Busca)
    const passaBusca = u.nome_proprietario
      ? u.nome_proprietario.toLowerCase().includes(busca.toLowerCase())
      : false;

    return passaFiltroStatus && passaBusca;
  });

  return (
    <div className="space-y-6 animate-fade-in-down pb-20">

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sun className="text-yellow-500 fill-yellow-500" />
            Usinas Solares
          </h1>
          <p className="text-gray-500 mt-1">Gerencie suas unidades geradoras de energia.</p>
        </div>

        <Link
          to="/usinas/novo"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Usina</span>
        </Link>
      </div>

      {/* --- BARRA DE BUSCA E FILTROS UNIFICADOS --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">

        {/* Campo de Busca */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usina por nome do proprietário..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Abas de Filtro */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltro('todos')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filtro === 'todos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro('disponiveis')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filtro === 'disponiveis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setFiltro('locadas')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filtro === 'locadas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Locadas
          </button>
        </div>
      </div>

      {/* RESULTADO DA CONTAGEM */}
      {!loading && (
        <div className="text-sm text-gray-400 font-medium px-1">
          {usinasFiltradas.length} {usinasFiltradas.length === 1 ? 'usina encontrada' : 'usinas encontradas'}
        </div>
      )}

      {/* LISTA DE CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : usinasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
          <div className="bg-yellow-50 p-4 rounded-full mb-4">
            <Sun className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma usina encontrada</h3>
          <p className="text-gray-500 max-w-xs mt-2">Tente buscar por outro nome ou cadastre uma nova usina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {usinasFiltradas.map((u) => (
            <Link
              to={`/usinas/${u.usina_id}`}
              key={u.usina_id}
              className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
            >
              {/* --- ALTERAÇÃO 1: FAIXA LATERAL (VERMELHO SE LOCADA) --- */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${u.is_locada ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

              {/* Ícone da Usina */}
              <div className="flex-shrink-0 pl-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-100 text-white">
                  <Zap className="w-7 h-7 fill-white" />
                </div>
              </div>

              {/* Informações Principais */}
              <div className="flex-1 text-center md:text-left min-w-[200px]">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {u.nome_proprietario}
                  </h3>

                  {/* --- ALTERAÇÃO 2: BADGE (VERMELHO SE LOCADA) --- */}
                  {u.is_locada ? (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide flex items-center gap-1">
                      <XCircle size={10} /> Locada
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle size={10} /> Disponível
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500 flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    {u.tipo || 'Tipo não inf.'}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-gray-700 bg-gray-50 px-2 rounded-md">
                    {formatMoeda(u.valor_kw_bruto || 0)} <span className="text-gray-400 font-normal">/kWh</span>
                  </span>
                </div>
              </div>

              {/* Dados Técnicos */}
              <div className="flex gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Potência</p>
                  <p className="text-lg font-bold text-gray-800">{u.potencia} <span className="text-sm font-medium text-gray-400">kWp</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Geração Est.</p>
                  <p className="text-lg font-bold text-gray-800">{u.geracao_estimada?.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">kWh</span></p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 border-l pl-4 ml-4 border-gray-100">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/usinas/${u.usina_id}/editar`;
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => solicitarExclusao(u.usina_id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

            </Link>
          ))}
        </div>
      )}

      {/* Modal de Confirmação */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Usina"
        message="Tem certeza absoluta? Isso apagará o histórico de geração e poderá afetar contratos vinculados."
        isDestructive={true}
        confirmText="Sim, Excluir Usina"
      />
    </div>
  );
}