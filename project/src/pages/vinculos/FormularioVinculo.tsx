import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioVinculo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    ConsumidorID: '',
    UsinaID: '',
    StatusID: '',
    Observacao: '' // Novo campo
  });

  const [listas, setListas] = useState({
    consumidores: [],
    usinas: [],
    status: []
  });

  useEffect(() => {
    // Carrega as listas para os Dropdowns
    Promise.all([
      api.consumidores.list(),
      api.usinas.list(),
      api.status.list()
    ]).then(([consumidores, usinas, status]) => {
      setListas({ consumidores, usinas, status });
    });

    // Se for edição, carrega os dados do vínculo
    if (isEditing) {
      api.vinculos.get(Number(id)).then((data) => {
        setFormData({
          ConsumidorID: data.ConsumidorID,
          UsinaID: data.UsinaID,
          StatusID: data.StatusID,
          Observacao: data.Observacao || '' // Garante string vazia se nulo
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ConsumidorID: Number(formData.ConsumidorID),
        UsinaID: Number(formData.UsinaID),
        StatusID: Number(formData.StatusID),
        Observacao: formData.Observacao
      };

      if (isEditing) {
        await api.vinculos.update(Number(id), dataToSend);
      } else {
        await api.vinculos.create(dataToSend);
      }
      navigate('/vinculos');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar vínculo');
    }
  };

  return (
    <div>
      {/* CABEÇALHO */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vinculos" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Vínculo' : 'Novo Vínculo'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-3xl">
          <div className="grid grid-cols-1 gap-8">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Consumidor *</label>
              <select
                required
                value={formData.ConsumidorID}
                onChange={e => setFormData({ ...formData, ConsumidorID: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2.5"
              >
                <option value="">Selecione um consumidor</option>
                {listas.consumidores.map((c: any) => (
                  <option key={c.ConsumidorID} value={c.ConsumidorID}>
                    {c.Nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usina *</label>
              <select
                required
                value={formData.UsinaID}
                onChange={e => setFormData({ ...formData, UsinaID: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2.5"
              >
                <option value="">Selecione uma usina</option>
                {listas.usinas.map((u: any) => (
                  <option key={u.UsinaID} value={u.UsinaID}>
                    {u.NomeProprietario} ({u.Tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                required
                value={formData.StatusID}
                onChange={e => setFormData({ ...formData, StatusID: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 p-2.5"
              >
                <option value="">Selecione um status</option>
                {listas.status.map((s: any) => (
                  <option key={s.StatusID} value={s.StatusID}>
                    {s.Descricao}
                  </option>
                ))}
              </select>
            </div>

            {/* CAMPO DE OBSERVAÇÃO */}
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações do Contrato</label>
              <textarea
                rows={4}
                value={formData.Observacao}
                onChange={e => setFormData({ ...formData, Observacao: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: Condições especiais de negociação, avisos importantes..."
              />
            </div>
          </div>
        </div>

        {/* BOTÃO DE SALVAR */}
        <div className="flex justify-start pt-2 max-w-3xl">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
          >
            <Save className="w-5 h-5" />
            Salvar Vínculo
          </button>
        </div>
      </form>
    </div>
  );
}