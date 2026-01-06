import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioUsina() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

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
    if (isEditing) {
      api.usinas.get(Number(id)).then((data) => {
        setFormData({
          NomeProprietario: data.NomeProprietario,
          Potencia: data.Potencia,
          Tipo: data.Tipo,
          ValorKWBruto: data.ValorKWBruto,
          GeracaoEstimada: data.GeracaoEstimada,
          InicioContrato: data.InicioContrato,
          VencimentoContrato: data.VencimentoContrato,
          TipoPagamento: data.TipoPagamento
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        Potencia: Number(formData.Potencia),
        ValorKWBruto: Number(formData.ValorKWBruto),
        GeracaoEstimada: Number(formData.GeracaoEstimada)
      };

      if (isEditing) {
        await api.usinas.update(Number(id), dataToSend);
      } else {
        await api.usinas.create(dataToSend);
      }
      navigate('/usinas');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar usina');
    }
  };

  return (
    <div>
      {/* CABEÇALHO IGUAL AO DO CONSUMIDOR */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/usinas" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Usina' : 'Nova Usina'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Proprietário</label>
            <input
              type="text"
              required
              value={formData.NomeProprietario}
              onChange={e => setFormData({ ...formData, NomeProprietario: e.target.value })}
              className="w-full"
              placeholder="Ex: Usina Solar Norte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Potência (kWp)</label>
            <input
              type="number"
              value={formData.Potencia}
              onChange={e => setFormData({ ...formData, Potencia: e.target.value })}
              className="w-full"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo (ex: GD1, GD2)</label>
            <input
              type="text"
              value={formData.Tipo}
              onChange={e => setFormData({ ...formData, Tipo: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor kW Bruto (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.ValorKWBruto}
              onChange={e => setFormData({ ...formData, ValorKWBruto: e.target.value })}
              className="w-full"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geração Estimada (kWh)</label>
            <input
              type="number"
              value={formData.GeracaoEstimada}
              onChange={e => setFormData({ ...formData, GeracaoEstimada: e.target.value })}
              className="w-full"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Início do Contrato</label>
            <input
              type="date"
              value={formData.InicioContrato}
              onChange={e => setFormData({ ...formData, InicioContrato: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vencimento do Contrato</label>
            <input
              type="date"
              value={formData.VencimentoContrato}
              onChange={e => setFormData({ ...formData, VencimentoContrato: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Pagamento</label>
            <input
              type="text"
              value={formData.TipoPagamento}
              onChange={e => setFormData({ ...formData, TipoPagamento: e.target.value })}
              className="w-full"
              placeholder="Ex: Consumo, Injetado"
            />
          </div>
        </div>

        {/* BOTÃO DE SALVAR PADRONIZADO */}
        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
          >
            <Save className="w-5 h-5" />
            Salvar Usina
          </button>
        </div>
      </form>
    </div>
  );
}