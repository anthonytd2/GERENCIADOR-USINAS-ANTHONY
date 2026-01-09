import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ListaVinculos() {
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVinculos = () => {
    setLoading(true);
    api.vinculos.list()
      .then((data) => {
        // Verifica se recebeu uma lista válida antes de usar
        if (Array.isArray(data)) {
          setVinculos(data);
          setError('');
        } else {
          console.error("Dados inválidos:", data);
          setVinculos([]);
          setError('Erro ao carregar dados. Verifique o servidor.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Erro de conexão com a API.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVinculos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este vínculo?')) return;
    try {
      await api.vinculos.delete(id);
      loadVinculos();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vínculos</h2>
        <Link
          to="/vinculos/novo"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Vínculo</span>
        </Link>
      </div>

      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {vinculos.length === 0 && !error ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum vínculo cadastrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumidor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vinculos.map((vinculo) => {
                  // Fallback para ler ID (tenta minúsculo, depois Maiúsculo)
                  const id = vinculo.vinculoid || vinculo.VinculoID;
                  
                  // Acessa as propriedades aninhadas em minúsculo (retorno do Supabase)
                  const nomeConsumidor = vinculo.consumidores?.nome || vinculo.Consumidores?.Nome || 'N/A';
                  const nomeUsina = vinculo.usinas?.nomeproprietario || vinculo.Usinas?.NomeProprietario || 'N/A';
                  const statusDesc = vinculo.status?.descricao || vinculo.Status?.Descricao || 'N/A';

                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          <Link to={`/vinculos/${id}`} className="text-blue-600 hover:text-blue-900 hover:underline">
                            {nomeConsumidor}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {nomeUsina}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {statusDesc}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/vinculos/${id}/editar`}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(id)}
                            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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