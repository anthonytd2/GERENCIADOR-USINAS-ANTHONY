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
        if (Array.isArray(data)) {
          setVinculos(data);
          setError('');
        } else {
          setVinculos([]);
          setError('Erro ao carregar dados.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Erro de conexão com o servidor.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVinculos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try { await api.vinculos.delete(id); loadVinculos(); } 
    catch (e) { alert("Erro ao deletar"); }
  };

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vínculos</h2>
        <Link to="/vinculos/novo" className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> <span>Novo Vínculo</span>
        </Link>
      </div>

      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {vinculos.length === 0 && !error ? (
          <div className="p-8 text-center text-gray-500">Nenhum vínculo cadastrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumidor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usina</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vinculos.map((vinculo) => {
                  // Tenta ler propriedades em minúsculo (novo padrão) ou Maiúsculo (fallback)
                  const id = vinculo.vinculoid || vinculo.VinculoID;
                  const nomeConsumidor = vinculo.consumidores?.nome || vinculo.Consumidores?.Nome || 'N/A';
                  const nomeUsina = vinculo.usinas?.nomeproprietario || vinculo.Usinas?.NomeProprietario || 'N/A';
                  const statusDesc = vinculo.status?.descricao || vinculo.Status?.Descricao || 'N/A';

                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/vinculos/${id}`} className="text-blue-600 hover:underline font-medium">
                          {nomeConsumidor}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{nomeUsina}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {statusDesc}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/vinculos/${id}/editar`} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Edit className="w-4 h-4 text-gray-700" /></Link>
                          <button onClick={() => handleDelete(id)} className="p-1 bg-red-100 rounded hover:bg-red-200"><Trash2 className="w-4 h-4 text-red-700" /></button>
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