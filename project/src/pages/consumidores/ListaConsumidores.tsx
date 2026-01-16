import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, Search, Percent, DollarSign, Zap } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  MediaConsumo: number;
  PercentualDesconto: number;
  TipoDesconto?: string;
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

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

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

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2 shadow-sm"
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
                  <tr key={c.ConsumidorID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/consumidores/${c.ConsumidorID}/editar`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-200 transition-colors">
                          {c.Nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {c.Nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {c.ConsumidorID}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{c.MediaConsumo.toLocaleString('pt-BR')} kWh</span>
                      </div>
                    </td>
                    
                    {/* --- BADGES E FORMATAÇÃO MONETÁRIA --- */}
                    <td className="px-6 py-4">
                      {c.TipoDesconto === 'valor_fixo' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <DollarSign className="w-3 h-3" />
                          {formatMoeda(Number(c.PercentualDesconto))} / kWh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Percent className="w-3 h-3" />
                          {c.PercentualDesconto}% Desc.
                        </span>
                      )}
                    </td>
                    {/* ------------------------------------- */}

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