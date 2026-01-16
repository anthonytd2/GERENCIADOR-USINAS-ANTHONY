import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Filter, ArrowUpDown } from 'lucide-react';
import Skeleton from '../../components/Skeleton'; // Seu novo componente

interface Usina {
  id: number;
  nome: string;
  potencia: number;
  tipo: string;
  valor_kw: number;
  geracao: number;
  is_locada: boolean;
}

export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ESTRATÉGIA: Estado para Filtros Rápidos
  const [filtro, setFiltro] = useState<'todos' | 'disponiveis' | 'locadas'>('todos');

  const loadUsinas = () => {
    setLoading(true); // Garante que o Skeleton apareça no reload
    api.usinas.list()
      .then((data: any) => {
        const listaBruta = Array.isArray(data) ? data : (data.data || []);
        
        // Adaptador Inteligente (Mantido para segurança)
        const listaNormalizada = listaBruta.map((item: any) => {
          const vinculos = item.Vinculos || item.vinculos || [];
          const temVinculoAtivo = vinculos.length > 0;
          return {
            id: item.id || item.UsinaID,
            nome: item.nome || item.NomeProprietario || 'Sem Nome',
            tipo: item.tipo || item.Tipo || 'N/A',
            potencia: item.potencia || item.Potencia || 0,
            geracao: item.geracao || item.GeracaoEstimada || 0,
            valor_kw: item.valor_kw || item.ValorKWBruto || 0,
            is_locada: item.is_locada !== undefined ? item.is_locada : temVinculoAtivo
          };
        });

        // ESTRATÉGIA: Ordenação Inteligente (Disponíveis Primeiro para Vender)
        listaNormalizada.sort((a: Usina, b: Usina) => {
          if (a.is_locada === b.is_locada) return 0;
          return a.is_locada ? 1 : -1; // Disponíveis (false) vêm antes
        });

        setUsinas(listaNormalizada);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsinas();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta usina?')) return;
    await api.usinas.delete(id);
    loadUsinas();
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Lógica de Filtragem Visual
  const usinasFiltradas = usinas.filter(u => {
    if (filtro === 'disponiveis') return !u.is_locada;
    if (filtro === 'locadas') return u.is_locada;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Usinas</h2>
          <p className="text-gray-500 mt-1">Gerencie suas unidades geradoras</p>
        </div>
        <Link
          to="/usinas/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Usina</span>
        </Link>
      </div>

      {/* ESTRATÉGIA: Barra de Filtros Rápidos */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button 
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          Todas
        </button>
        <button 
          onClick={() => setFiltro('disponiveis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'disponiveis' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <XCircle className="w-4 h-4" /> Disponíveis
        </button>
        <button 
          onClick={() => setFiltro('locadas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'locadas' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
        >
          <CheckCircle className="w-4 h-4" /> Locadas
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* VISUAL: Skeleton Loading (Efeito Carregando Profissional) */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : usinasFiltradas.length === 0 ? (
          
          /* VISUAL: Empty State (Estado Vazio Ilustrado) */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nenhuma usina encontrada</h3>
            <p className="text-gray-500 max-w-sm mt-1 mb-6">
              Não encontramos usinas com o filtro selecionado. Tente mudar o filtro ou cadastre uma nova.
            </p>
            {filtro !== 'todos' && (
              <button 
                onClick={() => setFiltro('todos')}
                className="text-brand-DEFAULT font-medium hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Proprietário</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Potência</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Geração Est.</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor kW</th>
                  <th className="px-6 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usinasFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/usinas/${u.id}`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold group-hover:bg-yellow-200 transition-colors">
                          {(u.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {u.nome}
                          </div>
                          <div className="text-xs text-gray-500">{u.tipo}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.potencia} kWp</td>
                    <td className="px-6 py-4 text-gray-600">{u.geracao.toLocaleString('pt-BR')} kWh</td>
                    <td className="px-6 py-4 font-medium text-emerald-700 bg-emerald-50/30">
                      {formatMoeda(u.valor_kw || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.is_locada ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wide border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Locada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wide border border-red-200">
                          <XCircle className="w-3 h-3" /> Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/usinas/${u.id}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}