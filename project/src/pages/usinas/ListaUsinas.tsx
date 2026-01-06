import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, Zap, CheckCircle, Lock } from 'lucide-react';

interface Usina {
  UsinaID: number;
  NomeProprietario: string;
  Potencia: number;
  Tipo: string;
  ValorKWBruto: number;
  GeracaoEstimada: number;
  // O backend agora retorna essa lista de vinculos
  Vinculos?: { VinculoID: number }[];
}

export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsinas = () => {
    api.usinas.list()
      .then(setUsinas)
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

  if (loading) return <div className="text-center py-10 text-lg text-gray-500">Carregando usinas...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Usinas</h2>
          <p className="text-gray-500 mt-1">Gerencie suas unidades geradoras</p>
        </div>
        <Link
          to="/usinas/novo"
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Usina</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {usinas.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Nenhuma usina cadastrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left">Proprietário</th>
                  <th className="px-6 text-left">Potência</th>
                  <th className="px-6 text-left">Tipo</th>
                  <th className="px-6 text-left">Geração Est.</th>
                  <th className="px-6 text-center">Status</th> {/* Nova Coluna */}
                  <th className="px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usinas.map((u) => {
                  // Lógica do Status: Se tem vínculos na lista, está locada
                  const isLocada = u.Vinculos && u.Vinculos.length > 0;

                  return (
                    <tr key={u.UsinaID} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6">
                        <Link to={`/usinas/${u.UsinaID}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-400" />
                          {u.NomeProprietario}
                        </Link>
                      </td>
                      <td className="px-6 text-gray-600">{u.Potencia} kWp</td>
                      <td className="px-6">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600 font-medium">
                          {u.Tipo}
                        </span>
                      </td>
                      <td className="px-6 text-gray-600">{u.GeracaoEstimada} kWh</td>
                      
                      {/* COLUNA DE STATUS COM CORES */}
                      <td className="px-6 text-center">
                        {isLocada ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wide border border-blue-200">
                            <Lock className="w-3 h-3" /> Locada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wide border border-green-200">
                            <CheckCircle className="w-3 h-3" /> Disponível
                          </span>
                        )}
                      </td>

                      <td className="px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/usinas/${u.UsinaID}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleDelete(u.UsinaID)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
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
    </div>
  );
}