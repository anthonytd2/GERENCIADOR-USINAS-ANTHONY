import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    NomeProprietario: '',
    Potencia: '',
    Tipo: '',
    ValorKWBruto: '',
    GeracaoEstimada: '',
    InicioContrato: '',
    VencimentoContrato: '',
    TipoPagamento: ''
  });

  useEffect(() => {
    if (id) {
      api.usinas.get(Number(id)).then((data) => {
        setFormData({
          NomeProprietario: data.NomeProprietario || '',
          Potencia: data.Potencia || '',
          Tipo: data.Tipo || '',
          ValorKWBruto: data.ValorKWBruto || '',
          GeracaoEstimada: data.GeracaoEstimada || '',
          InicioContrato: data.InicioContrato || '',
          VencimentoContrato: data.VencimentoContrato || '',
          TipoPagamento: data.TipoPagamento || ''
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      NomeProprietario: formData.NomeProprietario,
      Potencia: formData.Potencia ? Number(formData.Potencia) : null,
      Tipo: formData.Tipo || null,
      ValorKWBruto: formData.ValorKWBruto ? Number(formData.ValorKWBruto) : null,
      GeracaoEstimada: formData.GeracaoEstimada ? Number(formData.GeracaoEstimada) : null,
      InicioContrato: formData.InicioContrato || null,
      VencimentoContrato: formData.VencimentoContrato || null,
      TipoPagamento: formData.TipoPagamento || null
    };

    try {
      if (id) {
        await api.usinas.update(Number(id), payload);
        navigate(`/usinas/${id}`);
      } else {
        const result = await api.usinas.create(payload);
        navigate(`/usinas/${result.UsinaID}`);
      }
    } catch (error) {
      alert('Erro ao salvar usina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to={id ? `/usinas/${id}` : '/usinas'}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Editar Usina' : 'Nova Usina'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Proprietário *
            </label>
            <input
              type="text"
              required
              value={formData.NomeProprietario}
              onChange={(e) => setFormData({ ...formData, NomeProprietario: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potência (kWp)
              </label>
              <input
                type="number"
                value={formData.Potencia}
                onChange={(e) => setFormData({ ...formData, Potencia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo (ex: GD1, GD2)
              </label>
              <input
                type="text"
                value={formData.Tipo}
                onChange={(e) => setFormData({ ...formData, Tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor kW Bruto (R$)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.ValorKWBruto}
                onChange={(e) => setFormData({ ...formData, ValorKWBruto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geração Estimada (kWh)
              </label>
              <input
                type="number"
                value={formData.GeracaoEstimada}
                onChange={(e) => setFormData({ ...formData, GeracaoEstimada: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Início Contrato
              </label>
              <input
                type="date"
                value={formData.InicioContrato}
                onChange={(e) => setFormData({ ...formData, InicioContrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento Contrato
              </label>
              <input
                type="date"
                value={formData.VencimentoContrato}
                onChange={(e) => setFormData({ ...formData, VencimentoContrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Pagamento (ex: Consumo, Injetado)
            </label>
            <input
              type="text"
              value={formData.TipoPagamento}
              onChange={(e) => setFormData({ ...formData, TipoPagamento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              to={id ? `/usinas/${id}` : '/usinas'}
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
