import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.consumidores.list()
      .then(setConsumidores)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Consumidores</h2>
        <Link
          to="/consumidores/novo"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Consumidor</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {consumidores.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum consumidor cadastrado
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {consumidores.map((consumidor) => (
              <li key={consumidor.ConsumidorID}>
                <Link
                  to={`/consumidores/${consumidor.ConsumidorID}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-base font-medium text-gray-900">
                    {consumidor.Nome}
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
