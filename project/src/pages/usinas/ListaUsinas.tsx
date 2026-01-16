import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Filter } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

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
  const [filtro, setFiltro] = useState<'todos' | 'disponiveis' | 'locadas'>('todos');

  const loadUsinas = () => {
    setLoading(true);
    api.usinas.list()
      .then((data: any) => {
        const listaBruta = Array.isArray(data) ? data : (data.data || []);
        
        // ADAPTADOR INTELIGENTE (Tenta Maiúsculas e Minúsculas)
        const listaNormalizada = listaBruta.map((item: any) => {
          const vinculos = item.Vinculos || item.vinculos || [];
          const temVinculoAtivo = vinculos.length > 0;
          
          return {
            // Tenta UsinaID (Maiúsculo) primeiro, depois usinaid (minúsculo)
            id: item.UsinaID || item.usinaid || item.id, 
            
            // Tenta NomeProprietario (Maiúsculo) primeiro
            nome: item.NomeProprietario || item.nomeproprietario || item.nome || 'Sem Nome', 
            
            tipo: item.Tipo || item.tipo || 'N/A', 
            
            potencia: item.Potencia || item.potencia || 0, 
            
            geracao: item.GeracaoEstimada || item.geracaoestimada || item.geracao || 0, 
            
            valor_kw: item.ValorKWBruto || item.valorkwbruto || item.valor_kw || 0, 
            
            is_locada: item.is_locada !== undefined ? item.is_locada : temVinculoAtivo
          };
        });

        // Ordenação
        listaNormalizada.sort((a: Usina, b: Usina) => {
          if (a.is_locada === b.is_locada) return 0;
          return a.is_locada ? 1 : -1;
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
    if (!id) { alert("ID inválido"); return; }
    await api.usinas.delete(id);
    loadUsinas();
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

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

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>Todas</button>
        <button onClick={() => setFiltro('disponiveis')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'disponiveis' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-600 border border-gray-200'}`}><XCircle className="w-4 h-4" /> Disponíveis</button>
        <button onClick={() => setFiltro('locadas')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'locadas' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-600 border border-gray-200'}`}><CheckCircle className="w-4 h-4" /> Locadas</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : usinasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nenhuma usina encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Proprietário</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Potência</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Geração Est.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor kW</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usinasFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/usinas/${u.id}`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                          {(u.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600">{u.nome}</div>
                          <div className="text-xs text-gray-500">{u.tipo}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.potencia} kWp</td>
                    <td className="px-6 py-4 text-gray-600">{u.geracao.toLocaleString('pt-BR')} kWh</td>
                    <td className="px-6 py-4 font-medium text-emerald-700 bg-emerald-50/30">{formatMoeda(u.valor_kw || 0)}</td>
                    <td className="px-6 py-4 text-center">
                      {u.is_locada ? <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Locada</span> : <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">Disponível</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/usinas/${u.id}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit className="w-5 h-5" /></Link>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
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