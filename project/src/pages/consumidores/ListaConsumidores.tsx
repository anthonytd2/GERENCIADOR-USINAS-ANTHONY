import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, Edit, Trash2, MapPin, Zap } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

// Interface atualizada para o novo padrão do banco
interface Consumidor {
  consumidor_id: number;
  nome: string;
  cidade: string;
  uf: string;
  media_consumo: number;
  status?: string; // Opcional, caso venha do banco
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const loadConsumidores = () => {
    setLoading(true);
    api.consumidores.list()
      .then((data: any) => {
        setConsumidores(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConsumidores();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este consumidor?')) return;
    try {
      await api.consumidores.delete(id);
      loadConsumidores();
    } catch (error) {
      alert('Erro ao excluir. Verifique se o consumidor não possui vínculos ativos.');
    }
  };

  const filtrados = consumidores.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cidade && c.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Consumidores</h2>
          <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes</p>
        </div>
        <Link
          to="/consumidores/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Consumidor</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Barra de Busca */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por nome ou cidade..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum consumidor encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Localização</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Média Consumo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((c) => (
                  <tr key={c.consumidor_id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/consumidores/${c.consumidor_id}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {c.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {c.nome}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {c.cidade ? `${c.cidade}/${c.uf}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        {c.media_consumo?.toLocaleString('pt-BR')} kWh
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/consumidores/${c.consumidor_id}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(c.consumidor_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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