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
    Observacao: ''
  });

  const [listas, setListas] = useState<{consumidores:any[], usinas:any[], status:any[]}>({
    consumidores: [], usinas: [], status: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // 1. Carrega as listas (Dropdowns)
        const [c, u, s] = await Promise.all([
          api.consumidores.list().catch(() => []),
          api.usinas.list().catch(() => []),
          api.status.list().catch(() => [])
        ]);

        setListas({
          consumidores: Array.isArray(c) ? c : [],
          usinas: Array.isArray(u) ? u : [],
          status: Array.isArray(s) ? s : []
        });

        // 2. Se for edição, carrega os dados do vínculo e PREENCHE O FORMULÁRIO
        if (isEditing) {
          const vinculo = await api.vinculos.get(Number(id));
          
          // CORREÇÃO: Verifica maiúsculo OU minúsculo para preencher os campos corretamente
          setFormData({
            ConsumidorID: vinculo.ConsumidorID || vinculo.consumidorid || '',
            UsinaID: vinculo.UsinaID || vinculo.usinaid || '',
            StatusID: vinculo.StatusID || vinculo.statusid || '',
            Observacao: vinculo.Observacao || vinculo.observacao || ''
          });
        }
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
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
      alert('Erro ao salvar vínculo. Verifique os dados.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando formulário...</div>;

  return (
    <div>
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
                  <option key={c.ConsumidorID || c.consumidorid} value={c.ConsumidorID || c.consumidorid}>
                    {c.Nome || c.nome}
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
                  <option key={u.UsinaID || u.usinaid} value={u.UsinaID || u.usinaid}>
                    {u.NomeProprietario || u.nomeproprietario}
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
                  <option key={s.StatusID || s.statusid} value={s.StatusID || s.statusid}>
                    {s.Descricao || s.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
              <textarea
                rows={4}
                value={formData.Observacao}
                onChange={e => setFormData({ ...formData, Observacao: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Detalhes sobre o contrato, compensação, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-start pt-2 max-w-3xl">
          <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg">
            <Save className="w-5 h-5" />
            Salvar Vínculo
          </button>
        </div>
      </form>
    </div>
  );
}