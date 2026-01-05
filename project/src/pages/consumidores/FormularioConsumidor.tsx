import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Nome: '',
    MediaConsumo: '',
    PercentualDesconto: '',
    ValorKW: '',
    TempoContratoAnos: '',
    InicioContrato: '',
    VencimentoContrato: '',
    Vendedor: ''
  });

  useEffect(() => {
    if (id) {
      api.consumidores.get(Number(id)).then((data) => {
        setFormData({
          Nome: data.Nome || '',
          MediaConsumo: data.MediaConsumo || '',
          PercentualDesconto: data.PercentualDesconto || '',
          ValorKW: data.ValorKW || '',
          TempoContratoAnos: data.TempoContratoAnos || '',
          InicioContrato: data.InicioContrato || '',
          VencimentoContrato: data.VencimentoContrato || '',
          Vendedor: data.Vendedor || ''
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      Nome: formData.Nome,
      MediaConsumo: formData.MediaConsumo ? Number(formData.MediaConsumo) : null,
      PercentualDesconto: formData.PercentualDesconto ? Number(formData.PercentualDesconto) : null,
      ValorKW: formData.ValorKW ? Number(formData.ValorKW) : null,
      TempoContratoAnos: formData.TempoContratoAnos ? Number(formData.TempoContratoAnos) : null,
      InicioContrato: formData.InicioContrato || null,
      VencimentoContrato: formData.VencimentoContrato || null,
      Vendedor: formData.Vendedor || null
    };

    try {
      if (id) {
        await api.consumidores.update(Number(id), payload);
        navigate(`/consumidores/${id}`);
      } else {
        const result = await api.consumidores.create(payload);
        navigate(`/consumidores/${result.ConsumidorID}`);
      }
    } catch (error) {
      alert('Erro ao salvar consumidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to={id ? `/consumidores/${id}` : '/consumidores'}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? 'Editar Consumidor' : 'Novo Consumidor'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              required
              value={formData.Nome}
              onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Média Consumo (kWh)
              </label>
              <input
                type="number"
                value={formData.MediaConsumo}
                onChange={(e) => setFormData({ ...formData, MediaConsumo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentual Desconto (decimal, ex: 0.22)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.PercentualDesconto}
                onChange={(e) => setFormData({ ...formData, PercentualDesconto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor kW (R$)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.ValorKW}
                onChange={(e) => setFormData({ ...formData, ValorKW: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Contrato (anos)
              </label>
              <input
                type="number"
                value={formData.TempoContratoAnos}
                onChange={(e) => setFormData({ ...formData, TempoContratoAnos: e.target.value })}
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
              Vendedor
            </label>
            <input
              type="text"
              value={formData.Vendedor}
              onChange={(e) => setFormData({ ...formData, Vendedor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              to={id ? `/consumidores/${id}` : '/consumidores'}
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
