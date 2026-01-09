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

  // Tipagem flexível para evitar erros
  const [listas, setListas] = useState<{consumidores:any[], usinas:any[], status:any[]}>({
    consumidores: [], usinas: [], status: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarListas = async () => {
      try {
        // Carrega todas as listas
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

        if (isEditing) {
          const vinculo = await api.vinculos.get(Number(id));
          setFormData({
            // Tenta ler Maiúsculo (seu banco) ou minúsculo (padrão novo)
            ConsumidorID: vinculo.ConsumidorID || vinculo.consumidorid || '',
            UsinaID: vinculo.UsinaID || vinculo.usinaid || '',
            StatusID: vinculo.StatusID || vinculo.statusid || '',
            Observacao: vinculo.Observacao || vinculo.observacao || ''
          });
        }
      } catch (err) {
        console.error("Erro geral:", err);
      } finally {
        setLoading(false);
      }
    };
    carregarListas();
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

      if (isEditing) await api.vinculos.update(Number(id), dataToSend);
      else await api.vinculos.create(dataToSend);
      
      navigate('/vinculos');
    } catch (error) {
      alert('Erro ao salvar. Verifique se todos os campos estão preenchidos.');
    }
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <Link to="/vinculos" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" /> <span className="text-xl font-bold">Voltar</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-3xl space-y-6">
        <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Editar Vínculo' : 'Novo Vínculo'}</h2>
        
        {/* CONSUMIDOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Consumidor</label>
          <select required value={formData.ConsumidorID} onChange={e => setFormData({ ...formData, ConsumidorID: e.target.value })}
            className="w-full rounded-lg border-gray-300 p-2.5">
            <option value="">Selecione...</option>
            {listas.consumidores.map((c: any) => (
              <option key={c.ConsumidorID || c.consumidorid} value={c.ConsumidorID || c.consumidorid}>
                {c.Nome || c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* USINA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Usina</label>
          <select required value={formData.UsinaID} onChange={e => setFormData({ ...formData, UsinaID: e.target.value })}
            className="w-full rounded-lg border-gray-300 p-2.5">
            <option value="">Selecione...</option>
            {listas.usinas.map((u: any) => (
              <option key={u.UsinaID || u.usinaid} value={u.UsinaID || u.usinaid}>
                {u.NomeProprietario || u.nomeproprietario}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS - AQUI ESTAVA O PROBLEMA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select required value={formData.StatusID} onChange={e => setFormData({ ...formData, StatusID: e.target.value })}
            className="w-full rounded-lg border-gray-300 p-2.5">
            <option value="">Selecione...</option>
            {listas.status.map((s: any) => (
              // CORREÇÃO: Lê StatusID/Descricao (Maiúsculo) OU statusid/descricao (minúsculo)
              <option key={s.StatusID || s.statusid} value={s.StatusID || s.statusid}>
                {s.Descricao || s.descricao}
              </option>
            ))}
          </select>
        </div>

        {/* OBSERVAÇÃO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
          <textarea rows={3} value={formData.Observacao} onChange={e => setFormData({ ...formData, Observacao: e.target.value })}
            className="w-full rounded-lg border-gray-300" />
        </div>

        <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          <Save className="w-5 h-5" /> Salvar
        </button>
      </form>
    </div>
  );
}