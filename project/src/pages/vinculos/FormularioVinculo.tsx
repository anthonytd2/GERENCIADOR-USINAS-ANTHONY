import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
}

interface Usina {
  UsinaID: number;
  NomeProprietario: string;
}

interface Status {
  StatusID: number;
  Descricao: string;
}

export default function FormularioVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [formData, setFormData] = useState({
    ConsumidorID: '',
    UsinaID: '',
    StatusID: ''
  });

  useEffect(() => {
    Promise.all([
      api.consumidores.list(),
      api.usinas.list(),
      api.status.list()
    ]).then(([cons, usin, stat]) => {
      setConsumidores(cons);
      setUsinas(usin);
      setStatus(stat);
    });

    if (id) {
      api.vinculos.list().then((vinculos) => {
        const vinculo = vinculos.find((v: any) => v.VinculoID === Number(id));
        if (vinculo) {
          setFormData({
            ConsumidorID: String(vinculo.ConsumidorID),
            UsinaID: String(vinculo.UsinaID),
            StatusID: String(vinculo.StatusID)
          });
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ConsumidorID: Number(formData.ConsumidorID),
      UsinaID: Number(formData.UsinaID),
      StatusID: Number(formData.StatusID)
    };

    try {
      if (id) {
        await api.vinculos.update(Number(id), payload);
      } else {
        await api.vinculos.create(payload);
      }
      navigate('/vinculos');
    } catch (error) {
      alert('Erro ao salvar vínculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/vinculos"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Editar Vínculo' : 'Novo Vínculo'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consumidor *
            </label>
            <select
              required
              value={formData.ConsumidorID}
              onChange={(e) => setFormData({ ...formData, ConsumidorID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um consumidor</option>
              {consumidores.map((consumidor) => (
                <option key={consumidor.ConsumidorID} value={consumidor.ConsumidorID}>
                  {consumidor.Nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usina *
            </label>
            <select
              required
              value={formData.UsinaID}
              onChange={(e) => setFormData({ ...formData, UsinaID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma usina</option>
              {usinas.map((usina) => (
                <option key={usina.UsinaID} value={usina.UsinaID}>
                  {usina.NomeProprietario}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              required
              value={formData.StatusID}
              onChange={(e) => setFormData({ ...formData, StatusID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um status</option>
              {status.map((stat) => (
                <option key={stat.StatusID} value={stat.StatusID}>
                  {stat.Descricao}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              to="/vinculos"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
