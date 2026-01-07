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
    TipoDesconto: 'porcentagem', // Novo Campo (padrão %)
    TempoContratoAnos: '',
    InicioContrato: '',
    VencimentoContrato: '',
    Vendedor: '',
    Observacao: '' // Novo Campo
  });

  useEffect(() => {
    if (isEditing) {
      api.consumidores.get(Number(id)).then((data) => {
        setFormData({
          Nome: data.Nome,
          MediaConsumo: data.MediaConsumo,
          PercentualDesconto: data.PercentualDesconto,
          TipoDesconto: data.TipoDesconto || 'porcentagem',
          TempoContratoAnos: data.TempoContratoAnos,
          InicioContrato: data.InicioContrato,
          VencimentoContrato: data.VencimentoContrato,
          Vendedor: data.Vendedor,
          Observacao: data.Observacao || ''
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Dados Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" required value={formData.Nome}
                onChange={e => setFormData({ ...formData, Nome: e.target.value })}
                className="w-full" placeholder="Ex: João da Silva" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Média de Consumo (kWh)</label>
              <input type="number" required value={formData.MediaConsumo}
                onChange={e => setFormData({ ...formData, MediaConsumo: e.target.value })}
                className="w-full" placeholder="0" />
            </div>

            {/* SELEÇÃO DO TIPO DE COBRANÇA */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-blue-900 mb-2">Forma de Cobrança</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipoDesconto" value="porcentagem"
                    checked={formData.TipoDesconto === 'porcentagem'}
                    onChange={() => setFormData({ ...formData, TipoDesconto: 'porcentagem' })}
                    className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">Porcentagem (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipoDesconto" value="valor_fixo"
                    checked={formData.TipoDesconto === 'valor_fixo'}
                    onChange={() => setFormData({ ...formData, TipoDesconto: 'valor_fixo' })}
                    className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">Valor Fixo (R$)</span>
                </label>
              </div>

              <label className="block text-sm font-medium text-blue-800 mb-1">
                {formData.TipoDesconto === 'porcentagem' ? 'Percentual de Desconto (%)' : 'Valor Cobrado por kWh (R$)'}
              </label>
              <input type="number" step="0.01" required value={formData.PercentualDesconto}
                onChange={e => setFormData({ ...formData, PercentualDesconto: e.target.value })}
                className="w-full border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder={formData.TipoDesconto === 'porcentagem' ? "Ex: 15" : "Ex: 0.85"} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Contrato (Anos)</label>
              <input type="number" value={formData.TempoContratoAnos}
                onChange={e => setFormData({ ...formData, TempoContratoAnos: e.target.value })}
                className="w-full" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <input type="text" value={formData.Vendedor}
                onChange={e => setFormData({ ...formData, Vendedor: e.target.value })}
                className="w-full" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início Contrato</label>
              <input type="date" value={formData.InicioContrato}
                onChange={e => setFormData({ ...formData, InicioContrato: e.target.value })}
                className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento Contrato</label>
              <input type="date" value={formData.VencimentoContrato}
                onChange={e => setFormData({ ...formData, VencimentoContrato: e.target.value })}
                className="w-full" />
            </div>

            {/* CAMPO DE OBSERVAÇÃO */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
              <textarea 
                rows={4}
                value={formData.Observacao}
                onChange={e => setFormData({ ...formData, Observacao: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Digite aqui qualquer detalhe adicional..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1">
            <Save className="w-5 h-5" /> Salvar Consumidor
          </button>
        </div>
      </form>
    </div>
  );
}