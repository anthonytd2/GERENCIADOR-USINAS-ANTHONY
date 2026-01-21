import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import { Usina, Consumidor, VinculoFormInput } from '../../types'; // Importando nosso dicionário
import toast from 'react-hot-toast';


export default function FormularioVinculo() {
  const navigate = useNavigate();
  // Agora o useForm sabe exatamente quais campos existem!
  const { register, handleSubmit } = useForm<VinculoFormInput>();

  // As listas agora são blindadas: só aceitam Usinas e Consumidores reais
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Carrega as listas para o usuário selecionar
    Promise.all([
      api.usinas.list(),
      api.consumidores.list()
    ])
      .then(([uData, cData]) => {
        setUsinas(Array.isArray(uData) ? uData : []);
        setConsumidores(Array.isArray(cData) ? cData : []);
      })
      .catch(() => {
        toast.error('Erro ao carregar listas de usinas e consumidores.');
      });
  }, []);
  // O 'data' agora tem tipo, o TypeScript sabe que data.percentual existe
  const onSubmit = async (data: VinculoFormInput) => {
    setLoading(true);
    // 1. Feedback visual imediato
    const toastId = toast.loading('Criando vínculo...');

    try {
      // 2. Validação de Regra de Negócio
      if (Number(data.percentual) > 100) {
        throw new Error('O percentual não pode ser maior que 100%.');
      }

      // 3. Prepara os dados
      const payload = {
        usina_id: Number(data.usina_id),
        consumidor_id: Number(data.consumidor_id),
        percentual: Number(data.percentual),
        data_inicio: data.data_inicio,
        // Envia null se estiver vazio
        data_fim: data.data_fim || null,
        status_id: 1
      };

      // 4. Envia para o Backend
      await api.vinculos.create(payload);

      // 5. Sucesso!
      toast.success('Vínculo criado com sucesso!', { id: toastId });

      // 6. Redireciona após 1 segundo
      setTimeout(() => {
        navigate('/vinculos');
      }, 1000);

    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Erro ao criar vínculo';
      // 7. Erro visual
      toast.error(msg, { id: toastId });
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

        {/* LINHA DE DATAS E VALORES (3 Colunas agora) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. Percentual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentual (%)</label>
            <input
              type="number"
              defaultValue={100}
              {...register('percentual', { required: true, min: 0, max: 100 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 2. Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início da Injeção (Conexão)</label>
            <input
              type="date"
              {...register('data_inicio', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 3. Data Fim (NOVO CAMPO) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Desligamento (Opcional)</label>
            <input
              type="date"
              {...register('data_fim')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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