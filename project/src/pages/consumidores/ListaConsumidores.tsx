import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  MediaConsumo: number;
  PercentualDesconto: number;
  Vendedor: string;
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConsumidores = () => {
    api.consumidores.list()
      .then(setConsumidores)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConsumidores();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este consumidor?')) return;
    await api.consumidores.delete(id);
    loadConsumidores();
  };

  if (loading) return <div className="text-center py-10 text-lg text-gray-500">Carregando dados...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Consumidores</h2>
          <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes</p>
        </div>
        <Link
          to="/consumidores/novo"
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Consumidor</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {consumidores.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Nenhum consumidor encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left">Nome</th>
                  <th className="px-6 text-left">Consumo Médio</th>
                  <th className="px-6 text-left">Desconto</th>
                  <th className="px-6 text-left">Vendedor</th>
                  <th className="px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consumidores.map((c) => (
                  <tr key={c.ConsumidorID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6">
                      <Link to={`/consumidores/${c.ConsumidorID}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                        {c.Nome}
                      </Link>
                    </td>
                    <td className="px-6 text-gray-600">{c.MediaConsumo} kWh</td>
                    <td className="px-6">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        {c.PercentualDesconto}%
                      </span>
                    </td>
                    <td className="px-6 text-gray-600">{c.Vendedor || '-'}</td>
                    <td className="px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/consumidores/${c.ConsumidorID}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(c.ConsumidorID)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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