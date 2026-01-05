import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus } from 'lucide-react';

interface Usina {
  UsinaID: number;
  NomeProprietario: string;
}

export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.usinas.list()
      .then(setUsinas)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Usinas</h2>
        <Link
          to="/usinas/novo"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Usina</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {usinas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma usina cadastrada
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {usinas.map((usina) => (
              <li key={usina.UsinaID}>
                <Link
                  to={`/usinas/${usina.UsinaID}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-base font-medium text-gray-900">
                    {usina.NomeProprietario}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
