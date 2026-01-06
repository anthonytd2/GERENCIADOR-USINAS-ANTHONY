import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioConsumidor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    Nome: '',
    MediaConsumo: '',
    PercentualDesconto: '',
    // ValorKW: removido
    TempoContratoAnos: '',
    InicioContrato: '',
    VencimentoContrato: '',
    Vendedor: ''
  });

  useEffect(() => {
    if (isEditing) {
      api.consumidores.get(Number(id)).then((data) => {
        setFormData({
          Nome: data.Nome,
          MediaConsumo: data.MediaConsumo,
          PercentualDesconto: data.PercentualDesconto,
          TempoContratoAnos: data.TempoContratoAnos,
          InicioContrato: data.InicioContrato,
          VencimentoContrato: data.VencimentoContrato,
          Vendedor: data.Vendedor
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        MediaConsumo: Number(formData.MediaConsumo),
        PercentualDesconto: Number(formData.PercentualDesconto),
        TempoContratoAnos: Number(formData.TempoContratoAnos),
        // ValorKW não é enviado
      };

      if (isEditing) {
        await api.consumidores.update(Number(id), dataToSend);
      } else {
        await api.consumidores.create(dataToSend);
      }
      navigate('/consumidores');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar consumidor');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/consumidores" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Consumidor' : 'Novo Consumidor'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.Nome}
              onChange={e => setFormData({ ...formData, Nome: e.target.value })}
              className="w-full"
              placeholder="Ex: João da Silva"
            />
          </div>

          {/* Média Consumo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Média de Consumo (kWh)</label>
            <input
              type="number"
              required
              value={formData.MediaConsumo}
              onChange={e => setFormData({ ...formData, MediaConsumo: e.target.value })}
              className="w-full"
              placeholder="0"
            />
          </div>

          {/* Percentual Desconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentual de Desconto (%)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.PercentualDesconto}
              onChange={e => setFormData({ ...formData, PercentualDesconto: e.target.value })}
              className="w-full"
              placeholder="Ex: 15"
            />
          </div>

          {/* Tempo Contrato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Contrato (Anos)</label>
            <input
              type="number"
              value={formData.TempoContratoAnos}
              onChange={e => setFormData({ ...formData, TempoContratoAnos: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Vendedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor Responsável</label>
            <input
              type="text"
              value={formData.Vendedor}
              onChange={e => setFormData({ ...formData, Vendedor: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Datas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início do Contrato</label>
            <input
              type="date"
              value={formData.InicioContrato}
              onChange={e => setFormData({ ...formData, InicioContrato: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento do Contrato</label>
            <input
              type="date"
              value={formData.VencimentoContrato}
              onChange={e => setFormData({ ...formData, VencimentoContrato: e.target.value })}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
          >
            <Save className="w-5 h-5" />
            Salvar Consumidor
          </button>
        </div>
      </form>
    </div>
  );
}