import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { Usina, Consumidor, VinculoFormInput } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileText, Activity } from 'lucide-react';

// CORREÇÃO AQUI: Usamos 'Omit' para evitar o conflito de tipos
interface VinculoFormInputExtended extends Omit<VinculoFormInput, 'status_id'> {
  observacoes?: string;
  status_id?: number | string;
}

export default function FormularioVinculo() {
  const navigate = useNavigate();

  const { register, handleSubmit } = useForm<VinculoFormInputExtended>();

  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.usinas.list(),
      api.consumidores.list(),
      api.status.list()
    ])
      .then(([uData, cData, sData]) => {
        setUsinas(Array.isArray(uData) ? uData : []);
        setConsumidores(Array.isArray(cData) ? cData : []);
        setStatusList(Array.isArray(sData) ? sData : []);
      })
      .catch(() => {
        toast.error('Erro ao carregar listas do sistema.');
      });
  }, []);

  const onSubmit = async (data: VinculoFormInputExtended) => {
    setLoading(true);
    const toastId = toast.loading('Criando vínculo...');

    try {
      if (Number(data.percentual) > 100) {
        throw new Error('O percentual não pode ser maior que 100%.');
      }

      const payload = {
        usina_id: Number(data.usina_id),
        consumidor_id: Number(data.consumidor_id),
        percentual: Number(data.percentual),
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        status_id: Number(data.status_id) || 1, // Garante que envia número
        observacoes: data.observacoes || null
      };

      await api.vinculos.create(payload);

      toast.success('Vínculo criado com sucesso!', { id: toastId });

      setTimeout(() => {
        navigate('/vinculos');
      }, 1000);

    } catch (error: any) {
      console.error("Erro no envio:", error);

      const msgBackend = error.response?.data?.error;
      const detalhesBackend = error.response?.data?.detalhes;

      if (detalhesBackend && detalhesBackend.length > 0) {
        toast.error(`${msgBackend}: ${detalhesBackend[0]}`, { id: toastId, duration: 6000 });
      }
      else if (msgBackend) {
        toast.error(msgBackend, { id: toastId });
      }
      else {
        const msgTecnica = error.message || 'Erro desconhecido';
        toast.error(`Erro ao criar vínculo: ${msgTecnica}`, { id: toastId });
      }
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
          <select {...register('usina_id', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
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
          <select {...register('consumidor_id', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            {consumidores.map(c => (
              <option key={c.consumidor_id} value={c.consumidor_id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS INICIAL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Status Inicial do Contrato
          </label>
          <select 
            {...register('status_id')} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o status...</option>
            {statusList.map(s => (
              <option key={s.status_id} value={s.status_id}>
                {s.descricao}
              </option>
            ))}
          </select>
        </div>

        {/* OBSERVAÇÕES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" /> Observações (Opcional)
          </label>
          <textarea
            {...register('observacoes')}
            placeholder="Ex: Protocolo Copel nº 123456... Aguardando vistoria..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* LINHA DE DATAS E VALORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentual (%)</label>
            <input
              type="number"
              defaultValue={100}
              {...register('percentual', { required: true, min: 0, max: 100 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início da Injeção</label>
            <input
              type="date"
              {...register('data_inicio', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim (Opcional)</label>
            <input
              type="date"
              {...register('data_fim')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Criar Vínculo'}
        </button>
      </form>
    </div>
  );
}