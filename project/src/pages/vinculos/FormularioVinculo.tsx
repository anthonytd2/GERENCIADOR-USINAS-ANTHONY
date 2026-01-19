import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioVinculo() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [usinas, setUsinas] = useState<any[]>([]);
  const [consumidores, setConsumidores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carrega as listas para o usuário selecionar
    Promise.all([
      api.usinas.list(),
      api.consumidores.list()
    ]).then(([uData, cData]) => {
      setUsinas(Array.isArray(uData) ? uData : []);
      setConsumidores(Array.isArray(cData) ? cData : []);
    });
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        usina_id: Number(data.usina_id),
        consumidor_id: Number(data.consumidor_id),
        percentual: Number(data.percentual),
        data_inicio: data.data_inicio
      };

      await api.vinculos.create(payload);
      navigate('/vinculos');
    } catch (error) {
      alert('Erro ao criar vínculo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/vinculos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Novo Vínculo</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
        
        {/* SELEÇÃO DA USINA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Usina</label>
          <select {...register('usina_id', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Selecione...</option>
            {usinas.map(u => (
              <option key={u.usina_id} value={u.usina_id}>
                {u.nome_proprietario} ({u.potencia} kWp)
              </option>
            ))}
          </select>
        </div>

        {/* SELEÇÃO DO CONSUMIDOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Consumidor</label>
          <select {...register('consumidor_id', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Selecione...</option>
            {consumidores.map(c => (
              <option key={c.consumidor_id} value={c.consumidor_id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentual (%)</label>
            <input 
              type="number" 
              defaultValue={100}
              {...register('percentual')} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input 
              type="date" 
              {...register('data_inicio')} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark font-bold shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Criar Vínculo'}
        </button>
      </form>
    </div>
  );
}