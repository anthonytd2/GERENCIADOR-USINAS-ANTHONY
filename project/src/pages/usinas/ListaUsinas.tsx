import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Usina {
  UsinaID: number;
  NomeProprietario: string;
  Potencia: number;
  Tipo: string;
  ValorKWBruto: number;
  GeracaoEstimada: number;
  Vinculos?: { VinculoID: number }[];
  vinculos?: { VinculoID: number }[];
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

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Proprietário</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Potência</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Geração Est.</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Valor kW</th>
                  <th className="px-6 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usinas.map((u) => {
                  const listaVinculos = u.Vinculos || u.vinculos || [];
                  const isLocada = listaVinculos.length > 0;

                  return (
                    <tr key={u.UsinaID} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/usinas/${u.UsinaID}`} className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold group-hover:bg-yellow-200 transition-colors">
                            {u.NomeProprietario.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {u.NomeProprietario}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.Tipo}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.Potencia} kWp</td>
                      <td className="px-6 py-4 text-gray-600">{u.GeracaoEstimada.toLocaleString('pt-BR')} kWh</td>
                      
                      {/* --- COLUNA FINANCEIRA NOVA --- */}
                      <td className="px-6 py-4 font-medium text-emerald-700 bg-emerald-50/30">
                        {formatMoeda(u.ValorKWBruto || 0)}
                      </td>
                      {/* ------------------------------- */}

                      <td className="px-6 py-4 text-center">
                        {isLocada ? (
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