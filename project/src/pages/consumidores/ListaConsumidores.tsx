import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, User, Search, Percent, DollarSign } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  MediaConsumo: number;
  PercentualDesconto: number;
  TipoDesconto?: string; // Campo novo que diz se é 'porcentagem' ou 'valor_fixo'
  Vendedor?: string;
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

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

  // Filtro de busca
  const consumidoresFiltrados = consumidores.filter(c => 
    c.Nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <div className="text-center py-10 text-gray-500">Carregando consumidores...</div>;

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

      {/* Barra de Busca */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {consumidoresFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Nenhum consumidor encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Média Consumo</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cobrança</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consumidoresFiltrados.map((c) => (
                  <tr key={c.ConsumidorID} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/consumidores/${c.ConsumidorID}/editar`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {c.Nome}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.MediaConsumo} kWh</td>
                    
                    {/* AQUI ESTÁ A CORREÇÃO VISUAL */}
                    <td className="px-6 py-4">
                      {c.TipoDesconto === 'valor_fixo' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <DollarSign className="w-3 h-3" />
                          R$ {Number(c.PercentualDesconto).toFixed(2)} / kWh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <Percent className="w-3 h-3" />
                          {c.PercentualDesconto}% Desc.
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-500">{c.Vendedor || '-'}</td>
                    <td className="px-6 py-4 text-right">
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