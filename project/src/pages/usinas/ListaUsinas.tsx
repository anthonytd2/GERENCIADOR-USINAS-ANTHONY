import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, Edit, Trash2, Zap, ArrowRight, Sun, Search, 
  CheckCircle, BarChart3, Leaf 
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtro
  const [filtro, setFiltro] = useState<'todos' | 'DISPONIVEL' | 'LOCADA'>('todos');
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
      toast.error('Erro ao excluir usina. Verifique vínculos.');
    } finally {
      setModalAberto(false);
      setIdParaExcluir(null);
    }
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  // --- CÁLCULOS DE RESUMO (KPIs) ---
  const totalPotencia = usinas.reduce((acc, u) => acc + (Number(u.potencia) || 0), 0);
  const totalGeracao = usinas.reduce((acc, u) => acc + (Number(u.geracao_estimada) || 0), 0);

  // --- LÓGICA DE FILTRO ---
  const usinasFiltradas = usinas.filter(u => {
    const estaLocada = u.is_locada === true;
    
    let passaFiltroStatus = true;
    
    if (filtro === 'LOCADA') {
        passaFiltroStatus = estaLocada;
    } else if (filtro === 'DISPONIVEL') {
        passaFiltroStatus = !estaLocada;
    }

    const nomeReal = u.nome || u.nome_proprietario || '';
    const passaBusca = nomeReal.toLowerCase().includes(busca.toLowerCase());

    return passaFiltroStatus && passaBusca;
  });

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">

      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl shadow-sm">
            <Sun className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Usinas Solares
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Gerencie suas unidades geradoras e monitore a disponibilidade.
            </p>
          </div>
        </div>

        <Link
          to="/usinas/novo"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Usina
        </Link>
      </div>

      {/* 2. AREA DE KPIS */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total de Usinas</p>
              <p className="text-2xl font-bold text-gray-900">{usinas.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Zap className="w-6 h-6 fill-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Potência Instalada</p>
              <p className="text-2xl font-bold text-gray-900">{totalPotencia.toLocaleString('pt-BR')} <span className="text-sm text-gray-400">kWp</span></p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Capacidade Estimada</p>
              <p className="text-2xl font-bold text-gray-900">{totalGeracao.toLocaleString('pt-BR')} <span className="text-sm text-gray-400">kWh</span></p>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTÕES DE FILTRO */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usina por nome..."
            className="w-full pl-12 pr-4 py-2.5 bg-transparent font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="flex gap-1 p-1 bg-gray-100/50 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${
              filtro === 'todos' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltro('DISPONIVEL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${
              filtro === 'DISPONIVEL' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Disponíveis
          </button>
          <button
            onClick={() => setFiltro('LOCADA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${
              filtro === 'LOCADA' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Locadas
          </button>
        </div>
      </div>

      {/* 4. LISTA DE CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : usinasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Sun className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma usina encontrada</h3>
          <p className="text-gray-500 text-sm mt-1">Verifique o filtro ou cadastre a primeira usina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {usinasFiltradas.map((u) => {
            const estaLocada = u.is_locada;
            const nomeExibicao = u.nome || u.nome_proprietario || 'Sem Nome';
            const idReal = u.id || u.usina_id;

            return (
              <Link
                to={`/usinas/${idReal}`}
                key={idReal}
                className="group bg-white p-0 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col md:flex-row items-stretch overflow-hidden relative"
              >
                {/* Faixa lateral */}
                <div className={`w-1.5 ${estaLocada ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>

                <div className="flex-1 p-5 flex flex-col md:flex-row items-center gap-6">
                  
                  {/* Ícone Usina */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-100 text-white transform group-hover:scale-105 transition-transform">
                      <Zap className="w-8 h-8 fill-white" />
                    </div>
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1 text-center md:text-left min-w-[200px]">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {nomeExibicao}
                      </h3>
                      
                      {estaLocada ? (
                        <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-100 uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle size={10} /> Locada
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wide flex items-center gap-1">
                          <CheckCircle size={10} /> Disponível
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        {u.tipo || 'Tipo n/a'}
                      </span>
                      <span className="flex items-center gap-1.5">
                         <span className="w-px h-3 bg-gray-300"></span>
                         {formatMoeda(u.valor_kw_bruto || 0)}/kWh
                      </span>
                    </div>
                  </div>

                  {/* DADOS TÉCNICOS (VISUAL NOVO COM ÍCONES E CORES) */}
                  <div className="flex flex-col md:flex-row gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    
                    {/* Bloco Potência */}
                    <div className="flex items-center gap-3 pr-4 md:border-r border-gray-200">
                      <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                        <Zap className="w-4 h-4 fill-yellow-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Potência</p>
                        <p className="text-base font-bold text-gray-900 leading-none">
                          {u.potencia} <span className="text-xs text-gray-500 font-medium">kWp</span>
                        </p>
                      </div>
                    </div>

                    {/* Bloco Geração */}
                    <div className="flex items-center gap-3 pl-2">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Sun className="w-4 h-4 fill-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Geração Est.</p>
                        <p className="text-base font-bold text-gray-900 leading-none">
                          {u.geracao_estimada?.toLocaleString('pt-BR')} <span className="text-xs text-gray-500 font-medium">kWh</span>
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Ações (Hover) */}
                  <div className="flex items-center gap-1 md:ml-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/usinas/${idReal}/editar`;
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => solicitarExclusao(idReal, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="p-2 text-gray-300 group-hover:text-blue-500 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Usina"
        message="Tem certeza? Isso apagará o histórico e pode afetar contratos."
        isDestructive={true}
        confirmText="Excluir Usina"
      />
    </div>
  );
}